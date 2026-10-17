<?php

namespace App\Http\Controllers\PublicAlbum;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Services\GoogleDriveException;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\Response;

/**
 * Authenticated image proxy. Private Google Drive thumbnails can't be loaded
 * directly in an <img> tag (their googleusercontent links are auth-gated and
 * expire). This proxy fetches the resized image server-side using the Drive
 * credentials and caches the BYTES ON DISK (never in the database cache, which
 * can't safely hold large binaries), then serves them from our own domain.
 *
 * Open (no album token) so images render for anyone with the shared link; the
 * photo is still scoped to its album + must be available.
 */
class ImageController extends Controller
{
    public function thumb(Request $request, GoogleDriveService $drive, string $slug, int $id): Response
    {
        return $this->serve($drive, $slug, $id, 400, 'thumb', 60 * 60 * 24 * 7);
    }

    public function preview(Request $request, GoogleDriveService $drive, string $slug, int $id): Response
    {
        return $this->serve($drive, $slug, $id, 1600, 'preview', 60 * 60 * 24 * 3);
    }

    private function serve(GoogleDriveService $drive, string $slug, int $id, int $size, string $kind, int $ttl): Response
    {
        $album = Album::where('slug', $slug)->first();
        abort_if(! $album || ! $album->isAccessible(), 404);

        $photo = $album->photos()->where('id', $id)->where('is_available', true)->first();
        abort_if(! $photo, 404);

        // Demo photos use public placeholder URLs — just redirect to them.
        if ($album->drive_auth_mode === 'demo') {
            $url = $kind === 'thumb' ? $photo->thumbnail_url : $photo->preview_url;

            return $url ? redirect()->away($url) : abort(404);
        }

        // On-disk cache: storage/app/imgcache/{kind}/{photoId}_{size}.bin (+ .ct)
        $dir = storage_path("app/imgcache/{$kind}");
        $base = "{$dir}/{$photo->id}_{$size}";
        $binFile = "{$base}.bin";
        $ctFile = "{$base}.ct";

        $fresh = is_file($binFile) && (time() - filemtime($binFile) < $ttl);

        if (! $fresh) {
            try {
                [$body, $contentType] = $drive->fetchThumbnailBytes($photo->google_drive_file_id, $size);
            } catch (GoogleDriveException $e) {
                // If we have a stale cached copy, serve it rather than erroring.
                if (is_file($binFile)) {
                    $body = (string) file_get_contents($binFile);
                    $contentType = is_file($ctFile) ? trim((string) file_get_contents($ctFile)) : 'image/jpeg';

                    return $this->imageResponse($body, $contentType, $ttl);
                }
                abort(502, $e->userMessage);
            }

            File::ensureDirectoryExists($dir);
            @file_put_contents($binFile, $body);
            @file_put_contents($ctFile, $contentType ?: 'image/jpeg');
        } else {
            $body = (string) file_get_contents($binFile);
            $contentType = is_file($ctFile) ? trim((string) file_get_contents($ctFile)) : 'image/jpeg';
        }

        return $this->imageResponse($body, $contentType, $ttl);
    }

    private function imageResponse(string $body, string $contentType, int $ttl): Response
    {
        return response($body, 200, [
            'Content-Type' => $contentType ?: 'image/jpeg',
            'Cache-Control' => "public, max-age={$ttl}",
        ]);
    }
}
