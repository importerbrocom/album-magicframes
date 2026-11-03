<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\LeadStatusLog;
use App\Rules\PhoneNumber;
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
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => ['required', new PhoneNumber],
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
        $lead = Lead::create([
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
