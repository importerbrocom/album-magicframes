<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateAlbumRequest;
use App\Http\Requests\UpdateAlbumRequest;
use App\Http\Resources\AdminAlbumResource;
use App\Jobs\SyncAlbumFromGoogleDrive;
use App\Models\Album;
use App\Services\AlbumService;
use App\Services\AnalyticsService;
use App\Services\GoogleDriveException;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class AlbumController extends Controller
{
    public function __construct(
        private AlbumService $albums,
        private GoogleDriveService $drive,
        private AnalyticsService $analytics,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Album::class);

        $albums = Album::query()
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%' . $request->string('q') . '%';
                $q->where('client_name', 'like', $term)->orWhere('title', 'like', $term);
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('category'), fn ($q) => $q->where('category', $request->string('category')))
            ->orderByDesc('created_at')
            ->paginate(15);

        return AdminAlbumResource::collection($albums)->response();
    }

    /** Distinct, non-empty album categories for admin filters (alphabetical). */
    public function categories(): JsonResponse
    {
        $this->authorize('viewAny', Album::class);

        $categories = Album::query()
            ->whereNotNull('category')
            ->where('category', '!=', '')
            ->distinct()
            ->orderBy('category')
            ->pluck('category')
            ->values();

        return response()->json(['data' => $categories]);
    }

    public function store(CreateAlbumRequest $request): JsonResponse
    {
        $this->authorize('create', Album::class);

        $data = $request->validated();

        // Validate + extract the Drive folder id (unless running in demo mode).
        $authMode = $this->albums->resolveAuthMode();
        $folderId = null;

        try {
            $folderId = $this->drive->extractFolderId($data['google_drive_url']);

            if ($authMode !== 'demo') {
                // Verify the folder is actually reachable before creating.
                $this->drive->validateFolder($folderId);
            }
        } catch (GoogleDriveException $e) {
            if ($authMode !== 'demo') {
                return response()->json(['message' => $e->userMessage], 422);
            }
            // In demo mode an unreachable/placeholder link is acceptable.
        }

        $plainPassword = $data['password'];

        $album = Album::create([
            'user_id' => $request->user()->id,
            'client_name' => $data['client_name'],
            'title' => $data['title'],
            'category' => $data['category'] ?? null,
            'event_date' => $data['event_date'] ?? null,
            'slug' => $this->albums->generateSlug($data['client_name']),
            'password_hash' => Hash::make($plainPassword),
            'google_drive_url' => $data['google_drive_url'],
            'google_drive_folder_id' => $folderId,
            'drive_auth_mode' => $authMode,
            'description' => $data['description'] ?? null,
            'tagline' => $data['tagline'] ?? null,
            'cover_image_url' => $this->sanitizeCover($data['cover_image_url'] ?? null),
            'film_url' => $data['film_url'] ?? null,
            'video_gallery_url' => $data['video_gallery_url'] ?? null,
            'theme' => $data['theme'] ?? 'classic',
            'ambient_effect' => $data['ambient_effect'] ?? null,
            'ambient_speed' => $data['ambient_speed'] ?? null,
            'ambient_count' => $data['ambient_count'] ?? null,
            'status' => $data['status'] ?? 'active',
            'allow_download' => $data['allow_download'] ?? true,
            'allow_share' => $data['allow_share'] ?? true,
            'allow_comments' => $data['allow_comments'] ?? true,
            'allow_enquiries' => $data['allow_enquiries'] ?? true,
            'google_review_url' => $data['google_review_url'] ?? null,
            'expires_at' => $data['expires_at'] ?? null,
            'sync_status' => 'pending',
        ]);

        // Kick off background synchronization.
        SyncAlbumFromGoogleDrive::dispatch($album->id);

        return response()->json([
            'album' => new AdminAlbumResource($album),
            'share' => $this->albums->sharePayload($album, $plainPassword),
        ], 201);
    }

    /**
     * A Google Drive "/file/d/.../view" or "open?id=" link is a web page, not
     * an image, and can't render in an <img>. Reject those so the sync picks a
     * real photo as the cover instead. A plain image URL is kept as-is.
     */
    private function sanitizeCover(?string $url): ?string
    {
        if (! $url) {
            return null;
        }
        if (str_contains($url, 'drive.google.com/file/')
            || str_contains($url, 'drive.google.com/open')
            || str_ends_with($url, '/view')) {
            return null;
        }

        return $url;
    }

    public function show(Album $album): JsonResponse
    {
        $this->authorize('view', $album);

        return (new AdminAlbumResource($album))->response();
    }

    public function update(UpdateAlbumRequest $request, Album $album): JsonResponse
    {
        $this->authorize('update', $album);

        $data = $request->validated();

        if (! empty($data['password'])) {
            $album->password_hash = Hash::make($data['password']);
        }
        unset($data['password']);

        // If the Drive URL changed, re-extract the folder id.
        if (isset($data['google_drive_url']) && $data['google_drive_url'] !== $album->google_drive_url) {
            try {
                $album->google_drive_folder_id = $this->drive->extractFolderId($data['google_drive_url']);
            } catch (GoogleDriveException $e) {
                if ($album->drive_auth_mode !== 'demo') {
                    return response()->json(['message' => $e->userMessage], 422);
                }
            }
        }

        if (array_key_exists('cover_image_url', $data)) {
            $data['cover_image_url'] = $this->sanitizeCover($data['cover_image_url']);
        }

        $album->fill($data)->save();

        Cache::forget("album.public.{$album->slug}");

        return (new AdminAlbumResource($album))->response();
    }

    public function destroy(Album $album): JsonResponse
    {
        $this->authorize('delete', $album);
        $slug = $album->slug;
        $album->delete();
        Cache::forget("album.public.{$slug}");

        return response()->json(['message' => 'Album deleted.']);
    }

    /** Trigger a re-sync and invalidate cached listings. */
    public function sync(Album $album): JsonResponse
    {
        $this->authorize('update', $album);

        $album->forceFill([
            'sync_status' => 'pending',
            'sync_progress' => 0,
            'sync_message' => 'Queued for synchronization...',
        ])->save();

        Cache::forget("album.public.{$album->slug}");
        SyncAlbumFromGoogleDrive::dispatch($album->id);

        return response()->json(['message' => 'Synchronization started.', 'sync_status' => 'pending']);
    }

    /** Lightweight polling endpoint for sync progress. */
    public function syncStatus(Album $album): JsonResponse
    {
        $this->authorize('view', $album);

        return response()->json([
            'sync_status' => $album->sync_status,
            'sync_progress' => $album->sync_progress,
            'sync_message' => $album->sync_message,
            'photo_count' => $album->photo_count,
            'event_count' => $album->event_count,
            'last_synced_at' => $album->last_synced_at,
        ]);
    }

    public function analytics(Album $album): JsonResponse
    {
        $this->authorize('view', $album);

        return response()->json($this->analytics->summary($album));
    }

    public function share(Album $album): JsonResponse
    {
        $this->authorize('view', $album);

        return response()->json($this->albums->sharePayload($album));
    }

    /** Enquiries submitted from this album (admin view). */
    public function enquiries(Album $album): JsonResponse
    {
        $this->authorize('view', $album);

        return response()->json(
            $album->enquiries()->orderByDesc('created_at')->paginate(25)
        );
    }

    /** Comments left on this album (admin view). */
    public function comments(Album $album): JsonResponse
    {
        $this->authorize('view', $album);

        return response()->json(
            $album->comments()->orderByDesc('created_at')->paginate(25)
        );
    }

    /** Admin: list the album's video-gallery videos + their poster overrides. */
    public function galleryVideos(Album $album, GoogleDriveService $drive): JsonResponse
    {
        $this->authorize('view', $album);

        if (! $album->video_gallery_url || $album->drive_auth_mode === 'demo') {
            return response()->json(['data' => []]);
        }

        $folderId = null;
        if (preg_match('#/folders/([A-Za-z0-9_-]+)#', $album->video_gallery_url, $m)) {
            $folderId = $m[1];
        } else {
            $folderId = $drive->extractFolderId($album->video_gallery_url);
        }

        try {
            $videos = $drive->listVideoFiles($folderId);
        } catch (\Throwable $e) {
            return response()->json(['data' => [], 'error' => 'Could not list the video folder.']);
        }

        $posters = $album->video_posters ?: [];
        $data = array_map(fn ($v) => [
            'id' => $v['id'],
            'name' => $v['name'] ?? 'Video',
            'poster' => $posters[$v['id']] ?? '',
        ], $videos);

        return response()->json(['data' => $data]);
    }

    /** Admin: save the per-video poster map for the video gallery. */
    public function updateGalleryPosters(Request $request, Album $album): JsonResponse
    {
        $this->authorize('update', $album);

        $data = $request->validate([
            'posters' => ['array'],
            'posters.*' => ['nullable', 'string', 'max:1000'],
        ]);

        // Keep only non-empty entries.
        $posters = array_filter($data['posters'] ?? [], fn ($v) => is_string($v) && trim($v) !== '');
        $album->video_posters = $posters ?: null;
        $album->save();

        Cache::forget("album.public.{$album->slug}");

        return response()->json(['data' => $album->video_posters ?: []]);
    }

    /** Sections (root events) of an album, with their manual overrides. */
    public function sections(Album $album): JsonResponse
    {
        $this->authorize('view', $album);

        $events = $album->rootEvents()->orderBy('sort_order')->get()->map(fn ($e) => [
            'id' => $e->id,
            'name' => $e->name,
            'slug' => $e->slug,
            'photo_count' => $e->photo_count,
            'cover_image_url' => $e->cover_image_url,          // auto-detected
            'cover_override' => $e->cover_override,            // manual
            'film_drive_id' => $e->film_drive_id ? true : false, // auto video present?
            'film_url_override' => $e->film_url_override,      // manual
        ]);

        return response()->json(['data' => $events]);
    }

    /** Update a single section's manual cover/film overrides. */
    public function updateSection(Request $request, Album $album, \App\Models\Event $event): JsonResponse
    {
        $this->authorize('update', $album);
        abort_if($event->album_id !== $album->id, 404);

        $data = $request->validate([
            'cover_override' => ['nullable', 'string', 'max:1000'],
            'film_url_override' => ['nullable', 'string', 'max:1000'],
        ]);

        $event->fill([
            'cover_override' => $data['cover_override'] ?: null,
            'film_url_override' => $data['film_url_override'] ?: null,
        ])->save();

        Cache::forget("album.public.{$album->slug}");

        return response()->json(['data' => [
            'id' => $event->id,
            'cover_override' => $event->cover_override,
            'film_url_override' => $event->film_url_override,
        ]]);
    }
}
