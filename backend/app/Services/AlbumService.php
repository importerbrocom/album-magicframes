<?php

namespace App\Services;

use App\Models\Album;
use Illuminate\Support\Str;

class AlbumService
{
    public function __construct(private GoogleDriveService $drive)
    {
    }

    /**
     * Generate an unpredictable, URL-safe slug of the form
     * "rahul-anjali-a8f92" so sequential IDs are never exposed.
     */
    public function generateSlug(string $clientName): string
    {
        $base = Str::slug($clientName);
        $base = $base !== '' ? Str::limit($base, 40, '') : 'album';

        do {
            $suffix = Str::lower(Str::random(6));
            $slug = "{$base}-{$suffix}";
        } while (Album::where('slug', $slug)->exists());

        return $slug;
    }

    /**
     * Full shareable public URL for an album.
     */
    public function publicUrl(Album $album): string
    {
        $base = rtrim((string) config('services.album.public_base_url'), '/');

        return "{$base}/album/{$album->slug}";
    }

    /**
     * Prefill share payload returned to the admin after creation.
     */
    public function sharePayload(Album $album, ?string $plainPassword = null): array
    {
        $url = $this->publicUrl($album);

        $message = "{$album->client_name}'s {$album->title} album is ready.\n"
            . "View your memories here:\n{$url}";

        if ($plainPassword !== null) {
            $message .= "\n\nPassword:\n{$plainPassword}";
        }

        return [
            'url' => $url,
            'whatsapp' => 'https://wa.me/?text=' . rawurlencode($message),
            'message' => $message,
            'qr_url' => url("/api/public/albums/{$album->slug}/qr"),
        ];
    }

    /**
     * Resolve the effective auth mode for a newly created album based on
     * server configuration (demo | api_key | oauth).
     */
    public function resolveAuthMode(): string
    {
        if ($this->drive->isConfigured()) {
            return $this->drive->authMode();
        }

        return config('services.google_drive.demo_mode') ? 'demo' : $this->drive->authMode();
    }
}
