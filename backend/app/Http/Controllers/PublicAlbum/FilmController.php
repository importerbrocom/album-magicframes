<?php

namespace App\Http\Controllers\PublicAlbum;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Models\Event;
use App\Services\GoogleDriveException;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Streams films hosted on Google Drive — the album teaser (hero) and each
 * section's own clip. Open (no album token) so the <video> element can load
 * it, but scoped to an accessible album. Private Drive bytes are fetched
 * server-side with the studio's credentials, cached to disk, and served via
 * BinaryFileResponse (native HTTP Range handling → the player can seek).
 */
class FilmController extends Controller
{
    /** Album teaser film (hero play button / Watch the Film). */
    public function stream(Request $request, GoogleDriveService $drive, string $slug): Response
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible(), 404);
        abort_if(! $album->film_url, 404);

        if ($album->drive_auth_mode === 'demo') {
            return redirect()->away($album->film_url);
        }

        // film_url may be a direct file link OR a folder link (→ first video).
        $fileId = $drive->extractFileId($album->film_url);
        if (! $fileId && preg_match('#/folders/([A-Za-z0-9_-]+)#', $album->film_url, $m)) {
            $fileId = $drive->firstVideoIdInFolder($m[1]);
        } elseif ($fileId && $drive->isFolder($fileId)) {
            $fileId = $drive->firstVideoIdInFolder($fileId);
        }
        abort_if(! $fileId, 404);

        return $this->serveDriveVideo($drive, "album_{$album->id}", $fileId, sha1($album->film_url));
    }

    /** List the videos in the album's separate "Video Gallery" Drive folder. */
    public function videoGallery(Request $request, GoogleDriveService $drive, string $slug): \Illuminate\Http\JsonResponse
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible(), 404);
        abort_if(! $album->video_gallery_url, 404);

        if ($album->drive_auth_mode === 'demo') {
            // Demo albums: return public sample clips (played directly).
            $posters = $album->video_posters ?: [];
            $videos = \App\Services\DemoDriveData::videos();
            $data = array_map(fn ($v) => [
                'id' => $v['id'],
                'name' => $v['name'],
                'src' => $v['src'],
                'poster' => $posters[$v['id']] ?? $v['poster'],
            ], $album->applyVideoOrder($videos));

            return response()->json(['data' => $data]);
        }

        // Resolve the folder id from the saved link.
        $folderId = null;
        if (preg_match('#/folders/([A-Za-z0-9_-]+)#', $album->video_gallery_url, $m)) {
            $folderId = $m[1];
        } else {
            $folderId = $drive->extractFileId($album->video_gallery_url);
        }
        abort_if(! $folderId, 404);

        try {
            $videos = $drive->listVideoFiles($folderId);
        } catch (GoogleDriveException $e) {
            return response()->json(['data' => []]);
        }

        $videos = $album->applyVideoOrder($videos);
        $posters = $album->video_posters ?: [];

        $data = array_map(function ($v) use ($slug, $posters) {
            $poster = $posters[$v['id']] ?? null;
            // A Drive image poster can't load in <img> directly — route it
            // through the poster proxy; a normal image URL is used as-is.
            if ($poster && str_contains($poster, 'drive.google.com')) {
                $poster = route('public.albums.videoposter', ['slug' => $slug, 'fileId' => $v['id']], false);
            }

            return [
                'id' => $v['id'],
                'name' => pathinfo($v['name'] ?? 'Video', PATHINFO_FILENAME),
                'src' => route('public.albums.videoitem', ['slug' => $slug, 'fileId' => $v['id']], false),
                'poster' => $poster, // null => frontend falls back to the first frame
            ];
        }, $videos);

        return response()->json(['data' => $data]);
    }

    /** Stream a single video from the album's video-gallery folder by file id. */
    public function videoItem(Request $request, GoogleDriveService $drive, string $slug, string $fileId): Response
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible(), 404);
        abort_if(! $album->video_gallery_url || $album->drive_auth_mode === 'demo', 404);

        // Only allow ids that actually live in this album's gallery folder.
        $folderId = null;
        if (preg_match('#/folders/([A-Za-z0-9_-]+)#', $album->video_gallery_url, $m)) {
            $folderId = $m[1];
        }
        if ($folderId) {
            $ids = array_column($drive->listVideoFiles($folderId), 'id');
            abort_if(! in_array($fileId, $ids, true), 404);
        }

        return $this->serveDriveVideo($drive, "galleryvid_{$album->id}_{$fileId}", $fileId, sha1($fileId));
    }

    /** List ALL videos inside a section's Drive folder (for its page grid). */
    public function eventVideos(Request $request, GoogleDriveService $drive, string $slug, string $event): \Illuminate\Http\JsonResponse
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible(), 404);

        $ev = Event::where('album_id', $album->id)->where('slug', $event)->first();
        abort_if(! $ev, 404);

        // Demo albums: sample clips so the section page shows a video grid.
        if ($album->drive_auth_mode === 'demo') {
            $base = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample';
            $samples = [
                ['id' => "demo-{$ev->slug}-1", 'name' => "{$ev->name} Film", 'src' => "{$base}/ForBiggerMeltdowns.mp4", 'poster' => 'https://picsum.photos/id/1043/800/450'],
                ['id' => "demo-{$ev->slug}-2", 'name' => 'Highlights', 'src' => "{$base}/ForBiggerFun.mp4", 'poster' => 'https://picsum.photos/id/1044/800/450'],
            ];

            return response()->json(['data' => $samples]);
        }

        if (! $ev->google_drive_folder_id) {
            return response()->json(['data' => []]);
        }

        try {
            $videos = $drive->listVideoFiles($ev->google_drive_folder_id);
        } catch (\Throwable $e) {
            return response()->json(['data' => []]);
        }

        $data = array_map(fn ($v) => [
            'id' => $v['id'],
            'name' => pathinfo($v['name'] ?? 'Video', PATHINFO_FILENAME),
            'src' => route('public.events.videoitem', ['slug' => $slug, 'event' => $event, 'fileId' => $v['id']], false),
            'poster' => null,
        ], $videos);

        return response()->json(['data' => $data]);
    }

    /** Stream a single video from a section's folder by file id. */
    public function eventVideoItem(Request $request, GoogleDriveService $drive, string $slug, string $event, string $fileId): Response
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible() || $album->drive_auth_mode === 'demo', 404);

        $ev = Event::where('album_id', $album->id)->where('slug', $event)->first();
        abort_if(! $ev || ! $ev->google_drive_folder_id, 404);

        // Only allow ids that actually live in this section's folder.
        $ids = array_column($drive->listVideoFiles($ev->google_drive_folder_id), 'id');
        abort_if(! in_array($fileId, $ids, true), 404);

        return $this->serveDriveVideo($drive, "eventvid_{$ev->id}_{$fileId}", $fileId, sha1($fileId));
    }

    /** Per-section film (a video detected inside the section's Drive folder). */
    public function eventFilm(Request $request, GoogleDriveService $drive, string $slug, string $event): Response
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible(), 404);
        abort_if($album->drive_auth_mode === 'demo', 404);

        $ev = Event::where('album_id', $album->id)->where('slug', $event)->first();
        abort_if(! $ev, 404);

        // Resolve the Drive id: a manual override (Drive file OR folder link)
        // wins; otherwise the auto-detected video in the section's folder.
        $fileId = null;
        $signature = '';
        if ($ev->film_url_override && str_contains($ev->film_url_override, 'drive.google.com')) {
            $signature = sha1($ev->film_url_override);
            $fileId = $drive->extractFileId($ev->film_url_override);
            if (! $fileId && preg_match('#/folders/([A-Za-z0-9_-]+)#', $ev->film_url_override, $m)) {
                $fileId = $drive->firstVideoIdInFolder($m[1]);
            } elseif ($fileId && $drive->isFolder($fileId)) {
                $fileId = $drive->firstVideoIdInFolder($fileId);
            }
        } elseif ($ev->film_drive_id) {
            $fileId = $ev->film_drive_id;
            $signature = sha1((string) $ev->film_drive_id);
        }

        abort_if(! $fileId, 404);

        return $this->serveDriveVideo($drive, "event_{$ev->id}", $fileId, $signature);
    }

    /**
     * Fetch (once) and serve a Drive video by file id, disk-cached under a
     * stable key, with Range support for seeking.
     */
    private function serveDriveVideo(GoogleDriveService $drive, string $cacheKey, string $fileId, string $signature): Response
    {
        $dir = storage_path('app/filmcache');
        $binFile = "{$dir}/{$cacheKey}.bin";
        $ctFile = "{$dir}/{$cacheKey}.ct";
        $keyFile = "{$dir}/{$cacheKey}.key";
        $cached = is_file($keyFile) ? trim((string) file_get_contents($keyFile)) : null;

        if (! is_file($binFile) || $cached !== $signature) {
            try {
                $meta = $drive->fileMeta($fileId);
                $stream = $drive->downloadStream($fileId);
            } catch (GoogleDriveException $e) {
                if (is_file($binFile)) {
                    return $this->fileResponse($binFile, $ctFile);
                }
                abort(502, $e->userMessage);
            }

            File::ensureDirectoryExists($dir);
            $tmp = "{$binFile}.tmp";
            $out = fopen($tmp, 'wb');
            while (! $stream->eof()) {
                fwrite($out, $stream->read(1024 * 256));
            }
            fclose($out);
            @rename($tmp, $binFile);
            @file_put_contents($ctFile, $meta['mimeType'] ?: 'video/mp4');
            @file_put_contents($keyFile, $signature);
        }

        return $this->fileResponse($binFile, $ctFile);
    }

    private function fileResponse(string $binFile, string $ctFile): BinaryFileResponse
    {
        $contentType = is_file($ctFile) ? trim((string) file_get_contents($ctFile)) : 'video/mp4';

        $response = new BinaryFileResponse($binFile);
        $response->headers->set('Content-Type', $contentType ?: 'video/mp4');
        $response->headers->set('Accept-Ranges', 'bytes');
        $response->headers->set('Cache-Control', 'public, max-age=' . (60 * 60 * 24));

        return $response;
    }
}
