<?php

namespace App\Http\Middleware;

use App\Models\Album;
use App\Services\AlbumTokenService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards public album content routes. Requires a bearer token that is valid
 * AND scoped to the album identified by {slug}. This is what prevents one
 * album's viewer from reaching another album by changing the URL.
 */
class EnsureAlbumAccess
{
    public function __construct(private AlbumTokenService $tokens)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $slug = $request->route('slug');
        $album = Album::where('slug', $slug)->first();

        if (! $album || ! $album->isAccessible()) {
            return response()->json(['message' => 'Album not found.'], 404);
        }

        $token = $request->bearerToken();

        if (! $token || ! $this->tokens->verifyForAlbum($token, $album)) {
            return response()->json([
                'message' => 'Album access required. Please enter the album password.',
            ], 401);
        }

        // Make the resolved album available to controllers.
        $request->attributes->set('album', $album);

        return $next($request);
    }
}
