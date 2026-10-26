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
