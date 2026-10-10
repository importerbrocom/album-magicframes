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
            ->orderByDesc('created_at')
            ->paginate(15);

        return AdminAlbumResource::collection($albums)->response();
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
            'slug' => $this->albums->generateSlug($data['client_name']),
            'password_hash' => Hash::make($plainPassword),
            'google_drive_url' => $data['google_drive_url'],
            'google_drive_folder_id' => $folderId,
            'drive_auth_mode' => $authMode,
            'description' => $data['description'] ?? null,
            'tagline' => $data['tagline'] ?? null,
            'cover_image_url' => $data['cover_image_url'] ?? null,
            'theme' => $data['theme'] ?? 'classic',
            'status' => $data['status'] ?? 'active',
            'allow_download' => $data['allow_download'] ?? true,
            'allow_share' => $data['allow_share'] ?? true,
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
}
