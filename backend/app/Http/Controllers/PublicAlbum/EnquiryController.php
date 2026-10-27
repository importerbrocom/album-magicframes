<?php

namespace App\Http\Controllers\PublicAlbum;

use App\Http\Controllers\Controller;
use App\Jobs\ForwardEnquiryToCrn;
use App\Models\Album;
use App\Models\Enquiry;
use App\Services\AnalyticsService;
use App\Services\CrnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public enquiry submission. Open to ANYONE viewing a shared album (including
 * reshared links / friends & family) — only the album slug is required, not
 * the album access token. Enquiries are stored locally and forwarded to CRN.
 */
class EnquiryController extends Controller
{
    public function __construct(private AnalyticsService $analytics)
    {
    }

    public function store(Request $request, CrnService $crn, string $slug): JsonResponse
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible(), 404, 'Album not found.');

        if (! $album->allow_enquiries) {
            return response()->json(['message' => 'Enquiries are disabled for this album.'], 403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:40'],
            'email' => ['nullable', 'email', 'max:150'],
            'message' => ['nullable', 'string', 'max:2000'],
            // Honeypot: bots fill hidden fields; humans leave it empty.
            'website' => ['nullable', 'size:0'],
        ]);

        if ($request->filled('website')) {
            // Silently accept to not tip off bots, but drop it.
            return response()->json(['ok' => true]);
        }

        $enquiry = Enquiry::create([
            'album_id' => $album->id,
            'album_slug' => $album->slug,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'email' => $data['email'] ?? null,
            'message' => $data['message'] ?? null,
            'visitor_hash' => $this->analytics->visitorHash($request, $album),
            'crn_status' => 'pending',
        ]);

        // Forward to CRN in the background (queue). If queue is sync, runs inline.
        ForwardEnquiryToCrn::dispatch($enquiry->id);

        return response()->json([
            'ok' => true,
            'message' => 'Thank you! Your enquiry has been sent.',
        ], 201);
    }
}
