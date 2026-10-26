<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\AnalyticsEvent;
use App\Models\Photo;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $isAdmin = $user->isAdmin();

        // Staff see only the albums they own; admins see everything.
        $albumScope = fn () => $isAdmin
            ? Album::query()
            : Album::query()->where('user_id', $user->id);

        $totalAlbums = $albumScope()->count();
        $activeAlbums = $albumScope()->where('status', 'active')->count();

        if ($isAdmin) {
            $totalPhotos = Photo::where('is_available', true)->count();
            $totalViews = AnalyticsEvent::where('type', 'album_view')->count();
        } else {
            $albumIds = $albumScope()->pluck('id');
            $totalPhotos = Photo::whereIn('album_id', $albumIds)->where('is_available', true)->count();
            $totalViews = AnalyticsEvent::whereIn('album_id', $albumIds)->where('type', 'album_view')->count();
        }

        $recentAlbums = $albumScope()->orderByDesc('created_at')->limit(6)->get()
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

        $stats = [
            'total_albums' => $totalAlbums,
            'active_albums' => $activeAlbums,
            'total_photos' => $totalPhotos,
            'total_views' => $totalViews,
        ];

        // Admin-only staff overview.
        if ($isAdmin) {
            $stats['total_staff'] = User::where('role', '!=', 'super_admin')->count();
            $stats['active_staff'] = User::where('role', '!=', 'super_admin')->where('status', 'active')->count();
        }

        return response()->json([
            'stats' => $stats,
            'recent_albums' => $recentAlbums,
            'role' => $user->role,
            'is_admin' => $isAdmin,
        ]);
    }
}
