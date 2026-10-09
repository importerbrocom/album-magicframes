<?php

namespace App\Services;

use App\Models\Album;
use App\Models\AnalyticsEvent;
use Illuminate\Http\Request;

class AnalyticsService
{
    /**
     * Record an analytics event. The visitor is identified by a salted hash
     * of IP + user agent (no raw PII stored).
     */
    public function record(Album $album, string $type, array $attributes = [], ?Request $request = null): void
    {
        $allowed = ['album_view', 'event_view', 'photo_view', 'download', 'share'];
        if (! in_array($type, $allowed, true)) {
            return;
        }

        AnalyticsEvent::create([
            'album_id' => $album->id,
            'type' => $type,
            'event_id' => $attributes['event_id'] ?? null,
            'photo_id' => $attributes['photo_id'] ?? null,
            'visitor_hash' => $request ? $this->visitorHash($request, $album) : ($attributes['visitor_hash'] ?? null),
            'meta' => $attributes['meta'] ?? null,
        ]);
    }

    public function visitorHash(Request $request, Album $album): string
    {
        $raw = $request->ip() . '|' . $request->userAgent() . '|' . $album->id;

        return hash_hmac('sha256', $raw, (string) config('app.key'));
    }

    /**
     * Aggregate analytics summary for the admin dashboard.
     */
    public function summary(Album $album): array
    {
        $base = $album->analyticsEvents();

        $totalViews = (clone $base)->where('type', 'album_view')->count();
        $uniqueVisitors = (clone $base)
            ->where('type', 'album_view')
            ->distinct('visitor_hash')
            ->count('visitor_hash');
        $photosViewed = (clone $base)->where('type', 'photo_view')->count();
        $downloads = (clone $base)->where('type', 'download')->count();
        $shares = (clone $base)->where('type', 'share')->count();

        $mostViewedEventId = (clone $base)
            ->where('type', 'event_view')
            ->whereNotNull('event_id')
            ->selectRaw('event_id, COUNT(*) as c')
            ->groupBy('event_id')
            ->orderByDesc('c')
            ->value('event_id');

        $mostViewedEvent = $mostViewedEventId
            ? $album->events()->find($mostViewedEventId)?->only(['id', 'name'])
            : null;

        $topPhotos = (clone $base)
            ->where('type', 'photo_view')
            ->whereNotNull('photo_id')
            ->selectRaw('photo_id, COUNT(*) as c')
            ->groupBy('photo_id')
            ->orderByDesc('c')
            ->limit(10)
            ->pluck('c', 'photo_id');

        return [
            'total_views' => $totalViews,
            'unique_visitors' => $uniqueVisitors,
            'photos_viewed' => $photosViewed,
            'downloads' => $downloads,
            'shares' => $shares,
            'most_viewed_event' => $mostViewedEvent,
            'top_photos' => $topPhotos,
        ];
    }
}
