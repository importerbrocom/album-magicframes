<?php

namespace App\Services;

use App\Models\Album;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

/**
 * Issues and verifies short-lived, album-scoped access tokens for public
 * viewers. A token grants access ONLY to the album it was minted for, so a
 * viewer can never reach another album by changing the URL.
 */
class AlbumTokenService
{
    private function secret(): string
    {
        $secret = config('services.album.token_secret') ?: config('app.key');

        return (string) $secret;
    }

    public function issue(Album $album): array
    {
        $ttlHours = (int) config('services.album.token_ttl_hours', 24);
        $now = time();
        $exp = $now + ($ttlHours * 3600);

        $payload = [
            'iss' => config('app.url'),
            'sub' => $album->slug,
            'aid' => $album->id,
            'iat' => $now,
            'exp' => $exp,
            'scope' => 'album_view',
        ];

        $token = JWT::encode($payload, $this->secret(), 'HS256');

        return [
            'token' => $token,
            'expires_at' => date(DATE_ATOM, $exp),
            'expires_in' => $ttlHours * 3600,
        ];
    }

    /**
     * Verify a token is valid AND scoped to the given album slug.
     */
    public function verifyForAlbum(string $token, Album $album): bool
    {
        try {
            $decoded = JWT::decode($token, new Key($this->secret(), 'HS256'));
        } catch (Throwable) {
            return false;
        }

        return ($decoded->sub ?? null) === $album->slug
            && ($decoded->aid ?? null) === $album->id
            && ($decoded->scope ?? null) === 'album_view';
    }
}
