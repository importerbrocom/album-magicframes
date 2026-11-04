<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStatusLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Token-protected Leads intake API for external sites (the album site at
 * album-magicframes.nokkoo.in forwards its enquiries here).
 *
 * Unlike LeadController@store (a web route needing CSRF + a logged-in user),
 * this authenticates with a shared-secret bearer token and attributes the
 * lead to a configured system user, so app-to-app calls work.
 */
class LeadApiController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // --- 1. Authenticate the caller with a shared secret -------------
        $expected = (string) config('services.leads_api.token', env('LEADS_API_TOKEN'));
        $provided = $this->bearerToken($request);

        if ($expected === '' || ! hash_equals($expected, (string) $provided)) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        // --- 2. Validate the incoming payload ----------------------------
        // Keep phone validation self-contained (don't depend on the app's
        // App\Rules\PhoneNumber class). Accept 7-15 digits, optionally with a
        // leading +, spaces, or dashes; store the raw value.
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => ['required', 'string', 'max:30', 'regex:/^\+?[0-9\s\-]{7,20}$/'],
            'email' => 'nullable|email|max:255',
            'notes' => 'nullable|string',
            'source' => 'nullable|in:website,referral,social_media,walk_in,other',
            'event_type' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // --- 3. Resolve the "system" user the lead is attributed to ------
        // created_by is NOT nullable and references users.id.
        $systemUserId = (int) config('services.leads_api.system_user_id', env('LEADS_API_SYSTEM_USER_ID', 1));

        // --- 4. Create the lead ------------------------------------------
        // Create WITHOUT firing model events. LeadObserver::created() sends a
        // WhatsApp "lead_welcome" message via NotificationDispatcher, which is
        // a blocking outbound HTTP call with no timeout — over the web it
        // stalls the request until the proxy/Cloudflare times out (HTTP 522).
        // Suppressing events keeps album-enquiry intake fast and avoids
        // auto-messaging every enquiry. (The CLI doesn't exhibit the stall, so
        // this only manifested over HTTP.)
        $lead = Lead::withoutEvents(function () use ($data, $systemUserId) {
            return Lead::create([
                'name' => $data['name'],
                'phone' => $data['phone'],
                'email' => $data['email'] ?? null,
                'notes' => $data['notes'] ?? null,
                'source' => $data['source'] ?? 'website',
                'status' => 'new',
                'priority' => Lead::DEFAULT_PRIORITY,
                'package' => null,
                'assigned_to' => null,
                'created_by' => $systemUserId,
            ]);
        });

        // --- 5. The Leads domain requires at least one event -------------
        $eventType = trim((string) ($data['event_type'] ?? 'Enquiry')) ?: 'Enquiry';
        $lead->leadEvents()->create([
            'event_type' => $eventType,
            'date' => null,
        ]);

        // --- 6. Status log, mirroring LeadController@store ---------------
        LeadStatusLog::create([
            'lead_id' => $lead->id,
            'previous_status' => null,
            'new_status' => 'new',
            'changed_by' => $systemUserId,
            'notes' => 'Lead created via album enquiry API.',
        ]);

        return response()->json([
            'message' => 'Lead created.',
            'id' => $lead->id,
        ], 201);
    }

    /**
     * Read the bearer token from the Authorization header (falls back to a
     * plain token if no "Bearer " prefix is used).
     */
    private function bearerToken(Request $request): ?string
    {
        $header = (string) $request->header('Authorization', '');
        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        return $header !== '' ? $header : null;
    }
}
