<?php

namespace App\Http\Controllers\PublicAlbum;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhotoResource;
use App\Models\Album;
use App\Models\Photo;
use App\Services\AnalyticsService;
use App\Services\GoogleDriveException;
use App\Services\GoogleDriveService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PhotoController extends Controller
{
    public function __construct(private AnalyticsService $analytics)
    {
    }

    /**
     * Paginated photos for a gallery, filtered by event and/or folder.
     * Never returns thousands of records at once (spec section 49).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var Album $album */
        $album = $request->attributes->get('album');

        $query = $album->photos()->where('is_available', true);

        if ($request->filled('event_id')) {
            $query->where('event_id', (int) $request->integer('event_id'));
        }

        if ($request->filled('folder_id')) {
            $query->where('folder_id', (int) $request->integer('folder_id'));
        } elseif ($request->boolean('direct_only')) {
            // Photos attached directly to the event (no sub-folder).
            $query->whereNull('folder_id');
        }

        if ($request->filled('q')) {
            $query->where('file_name', 'like', '%' . $request->string('q') . '%');
        }

        $photos = $query->orderBy('sort_order')->orderBy('id')
            ->paginate(min((int) $request->integer('per_page', 40), 100));

        return PhotoResource::collection($photos)
            ->additional(['allow_download' => $album->allow_download, 'album_slug' => $album->slug])
            ->response();
    }

    /** Single photo metadata (records a photo_view). */
    public function show(Request $request, string $slug, int $id): JsonResponse
    {
        /** @var Album $album */
        $album = $request->attributes->get('album');

        $photo = $album->photos()->where('id', $id)->where('is_available', true)->firstOrFail();

        $this->analytics->record($album, 'photo_view', [
            'photo_id' => $photo->id,
            'event_id' => $photo->event_id,
        ], $request);

        return (new PhotoResource($photo))
            ->additional(['allow_download' => $album->allow_download, 'album_slug' => $album->slug])
            ->response();
    }

    /**
     * Authorized download proxy. Streams the original through Laravel so Drive
     * credentials are never exposed. Honors the album's allow_download flag.
     */
    public function download(Request $request, GoogleDriveService $drive, string $slug, int $id): StreamedResponse|JsonResponse
    {
        /** @var Album $album */
        $album = $request->attributes->get('album');

        if (! $album->allow_download) {
            return response()->json(['message' => 'Downloads are disabled for this album.'], 403);
        }

        $photo = $album->photos()->where('id', $id)->where('is_available', true)->firstOrFail();

        $this->analytics->record($album, 'download', [
            'photo_id' => $photo->id,
            'event_id' => $photo->event_id,
        ], $request);

        // Demo photos point to a public URL; redirect to it for download.
        if ($album->drive_auth_mode === 'demo') {
            return response()->json(['url' => $photo->original_url]);
        }

        try {
            $stream = $drive->downloadStream($photo->google_drive_file_id);
        } catch (GoogleDriveException $e) {
            return response()->json(['message' => $e->userMessage], 502);
        }

        return response()->stream(function () use ($stream) {
            while (! $stream->eof()) {
                echo $stream->read(1024 * 64);
            }
        }, 200, [
            'Content-Type' => $photo->mime_type ?: 'application/octet-stream',
            'Content-Disposition' => 'attachment; filename="' . addslashes($photo->file_name) . '"',
        ]);
    }
}
