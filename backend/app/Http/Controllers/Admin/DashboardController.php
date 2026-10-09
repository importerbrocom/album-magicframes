<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\AnalyticsEvent;
use App\Models\Photo;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $totalAlbums = Album::count();
        $activeAlbums = Album::where('status', 'active')->count();
        $totalPhotos = Photo::where('is_available', true)->count();
        $totalViews = AnalyticsEvent::where('type', 'album_view')->count();

        $recentAlbums = Album::orderByDesc('created_at')->limit(6)->get()
            ->map(fn (Album $a) => [
                'id' => $a->id,
                'client_name' => $a->client_name,
                'title' => $a->title,
                'slug' => $a->slug,
                'status' => $a->status,
                'sync_status' => $a->sync_status,
                'photo_count' => $a->photo_count,
                'event_count' => $a->event_count,
                'cover_image_url' => $a->cover_image_url,
                'last_synced_at' => $a->last_synced_at,
            ]);

        return response()->json([
            'stats' => [
                'total_albums' => $totalAlbums,
                'active_albums' => $activeAlbums,
                'total_photos' => $totalPhotos,
                'total_views' => $totalViews,
            ],
            'recent_albums' => $recentAlbums,
        ]);
    }
}
