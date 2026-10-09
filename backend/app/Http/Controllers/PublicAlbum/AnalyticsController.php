<?php

namespace App\Http\Controllers\PublicAlbum;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function __construct(private AnalyticsService $analytics)
    {
    }

    /** Lightweight analytics beacon from the public album (share tracking etc.). */
    public function store(Request $request): JsonResponse
    {
        /** @var Album $album */
        $album = $request->attributes->get('album');

        $data = $request->validate([
            'type' => ['required', 'string', 'in:event_view,photo_view,download,share'],
            'event_id' => ['nullable', 'integer'],
            'photo_id' => ['nullable', 'integer'],
            'meta' => ['nullable', 'array'],
        ]);

        $this->analytics->record($album, $data['type'], [
            'event_id' => $data['event_id'] ?? null,
            'photo_id' => $data['photo_id'] ?? null,
            'meta' => $data['meta'] ?? null,
        ], $request);

        return response()->json(['ok' => true]);
    }
}
