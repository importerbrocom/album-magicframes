<?php

namespace App\Services;

use App\Models\Enquiry;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

/**
 * Forwards album enquiries to the external CRN/Leads system
 * (https://magic.nokkoo.in/api/leads). The endpoint, HTTP method, auth header and
 * field mapping are all configurable via config/services.php (env), so this
 * works with whatever lead-intake API the CRN exposes without code changes.
 *
 * Enquiries are ALWAYS persisted locally first; CRN forwarding is best-effort
 * and its success/failure is recorded on the enquiry (crn_status).
 */
class CrnService
{
    private Client $http;

    public function __construct(?Client $http = null)
    {
        $this->http = $http ?? new Client([
            'timeout' => 15,
            'connect_timeout' => 8,
        ]);
    }

    public function isConfigured(): bool
    {
        return (bool) config('services.crn.endpoint');
    }

    /**
     * Push an enquiry to CRN. Updates the enquiry's crn_status/crn_response.
     * Returns true on success. Safe to call from a queued job.
     */
    public function forward(Enquiry $enquiry): bool
    {
        if (! $this->isConfigured()) {
            $enquiry->update([
                'crn_status' => 'skipped',
                'crn_response' => 'CRN endpoint not configured.',
            ]);

            return false;
        }

        $endpoint = (string) config('services.crn.endpoint');
        $method = strtoupper((string) config('services.crn.method', 'POST'));
        $source = (string) config('services.crn.source', 'website');
        $eventType = (string) config('services.crn.event_type', 'Enquiry');

        // Map our fields to the CRN's expected field names (configurable).
        $map = config('services.crn.field_map', [
            'name' => 'name',
            'phone' => 'phone',
            'email' => 'email',
            'notes' => 'notes',
            'source' => 'source',
            'event_type' => 'event_type',
        ]);

        // The Leads system has no "message" or "album" field, so we fold the
        // enquiry message and the album it came from into the lead's notes.
        $noteParts = [];
        if ($enquiry->message) {
            $noteParts[] = trim((string) $enquiry->message);
        }
        if ($enquiry->album_slug) {
            $noteParts[] = 'Album: ' . $enquiry->album_slug;
        }
        $notes = implode("\n\n", $noteParts) ?: null;

        $payload = [
            $map['name'] => $enquiry->name,
            $map['phone'] => $enquiry->phone,
            $map['email'] => $enquiry->email,
            $map['notes'] => $notes,
            $map['source'] => $source,
            $map['event_type'] => $eventType,
        ];

        $headers = ['Accept' => 'application/json'];
        if ($token = config('services.crn.token')) {
            $header = (string) config('services.crn.token_header', 'Authorization');
            $prefix = (string) config('services.crn.token_prefix', 'Bearer ');
            $headers[$header] = $prefix . $token;
        }

        try {
            $options = ['headers' => $headers];
            if ($method === 'GET') {
                $options['query'] = $payload;
            } elseif (config('services.crn.as_form')) {
                $options['form_params'] = $payload;
            } else {
                $options['json'] = $payload;
            }

            $response = $this->http->request($method, $endpoint, $options);
            $status = $response->getStatusCode();
            $ok = $status >= 200 && $status < 300;

            $enquiry->update([
                'crn_status' => $ok ? 'sent' : 'failed',
                'crn_response' => "HTTP {$status}: " . mb_substr((string) $response->getBody(), 0, 500),
            ]);

            return $ok;
        } catch (GuzzleException $e) {
            Log::warning('CRN enquiry forward failed', ['enquiry' => $enquiry->id, 'error' => $e->getMessage()]);
            $enquiry->update([
                'crn_status' => 'failed',
                'crn_response' => mb_substr($e->getMessage(), 0, 500),
            ]);

            return false;
        }
    }
}
