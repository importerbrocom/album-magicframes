<?php

namespace App\Http\Controllers\PublicAlbum;

use App\Http\Controllers\Controller;
use App\Http\Resources\EventResource;
use App\Http\Resources\PublicAlbumResource;
use App\Models\Album;
use App\Services\AlbumTokenService;
use App\Services\AnalyticsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Public (unauthenticated) album endpoints. Access is gated by an album
 * password; a successful verification mints a short-lived, album-scoped token.
 */
class AlbumAccessController extends Controller
{
    public function __construct(
        private AlbumTokenService $tokens,
        private AnalyticsService $analytics,
    ) {
    }

    /** Resolve an accessible album by slug or fail with a safe 404. */
    private function resolveAlbum(string $slug): Album
    {
        $album = Album::where('slug', $slug)->first();

        abort_if(! $album || ! $album->isAccessible(), 404, 'Album not found.');

        return $album;
    }

    /** Public landing metadata (no photos): couple name, title, cover, theme. */
    public function landing(string $slug): JsonResponse
    {
        $album = $this->resolveAlbum($slug);

        return response()->json([
            'slug' => $album->slug,
            'client_name' => $album->client_name,
            'title' => $album->title,
            'tagline' => $album->tagline,
            'description' => $album->description,
            'cover_image_url' => $album->cover_image_url,
            'theme' => $album->theme,
            'allow_share' => $album->allow_share,
            'requires_password' => true,
        ]);
    }

    /** Verify the album password; issues a 24h access token on success. */
    public function verify(Request $request, string $slug): JsonResponse
    {
        $request->validate(['password' => ['required', 'string']]);

        $album = $this->resolveAlbum($slug);

        if (! Hash::check($request->string('password'), $album->password_hash)) {
            return response()->json(['message' => 'Incorrect password. Please try again.'], 401);
        }

        $this->analytics->record($album, 'album_view', [], $request);

        return response()->json([
            'access' => $this->tokens->issue($album),
            'album' => new PublicAlbumResource($album),
        ]);
    }

    /** Full album payload (requires a valid album token via middleware). */
    public function show(string $slug): JsonResponse
    {
        /** @var Album $album */
        $album = request()->attributes->get('album');
        $album->load(['rootEvents' => fn ($q) => $q->where('is_available', true)->orderBy('sort_order')]);

        return (new PublicAlbumResource($album))->response();
    }

    /** List events (home page cards). */
    public function events(): JsonResponse
    {
        /** @var Album $album */
        $album = request()->attributes->get('album');

        $events = $album->rootEvents()
            ->where('is_available', true)
            ->orderBy('sort_order')
            ->get();

        return EventResource::collection($events)->response();
    }

    /** A single event with its folders (event page). */
    public function event(Request $request, string $slug, string $event): JsonResponse
    {
        /** @var Album $album */
        $album = request()->attributes->get('album');

        $eventSlug = $event;
        $event = $album->events()->where('slug', $eventSlug)->firstOrFail();
        $event->load(['rootFolders' => fn ($q) => $q->where('is_available', true)->orderBy('sort_order')]);

        $this->analytics->record($album, 'event_view', ['event_id' => $event->id], $request);

        $folderCount = $event->folders()->where('is_available', true)->count();

        return response()->json([
            'event' => new EventResource($event),
            'folder_count' => $folderCount,
            // Photos that live directly on the event (not in a sub-folder).
            'has_direct_photos' => $event->photos()->whereNull('folder_id')->where('is_available', true)->exists(),
        ]);
    }
}
