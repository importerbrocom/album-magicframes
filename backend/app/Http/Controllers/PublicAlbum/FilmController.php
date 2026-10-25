<?php

namespace App\Http\Controllers\PublicAlbum;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Services\GoogleDriveException;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Streams an album's wedding film when it is hosted on Google Drive.
 *
 * Mirrors the image proxy: open (no album token) so the <video> element can
 * load it — including on the pre-auth login/cover screen — but still scoped to
 * an accessible album. Private Drive bytes are fetched server-side with the
 * studio's credentials and cached to disk, then served via BinaryFileResponse
 * which provides native HTTP Range handling so the player can seek.
 */
class FilmController extends Controller
{
    public function stream(Request $request, GoogleDriveService $drive, string $slug): Response
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible(), 404);
        abort_if(! $album->film_url, 404);

        $fileId = $drive->extractFileId($album->film_url);
        // Not a Drive link (YouTube/Vimeo/mp4) — nothing to proxy; the client
        // plays those directly, so this endpoint shouldn't have been called.
        abort_if(! $fileId, 404);

        // Demo albums: just redirect to the stored link.
        if ($album->drive_auth_mode === 'demo') {
            return redirect()->away($album->film_url);
        }

        $dir = storage_path('app/filmcache');
        $binFile = "{$dir}/{$album->id}.bin";
        $ctFile = "{$dir}/{$album->id}.ct";

        // Cache the whole video once; refresh if the stored film_url changed.
        $keyFile = "{$dir}/{$album->id}.key";
        $currentKey = sha1($album->film_url);
        $cachedKey = is_file($keyFile) ? trim((string) file_get_contents($keyFile)) : null;

        if (! is_file($binFile) || $cachedKey !== $currentKey) {
            try {
                $meta = $drive->fileMeta($fileId);
                $stream = $drive->downloadStream($fileId);
            } catch (GoogleDriveException $e) {
                if (is_file($binFile)) {
                    // Serve the stale copy rather than failing playback.
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
            @file_put_contents($keyFile, $currentKey);
        }

        return $this->fileResponse($binFile, $ctFile);
    }

    /**
     * Serve the cached file with Range support (seeking) and a sensible cache
     * header. BinaryFileResponse honours the incoming Range header natively.
     */
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
