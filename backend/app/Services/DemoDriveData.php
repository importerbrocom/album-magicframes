<?php

namespace App\Services;

/**
 * Demo/fixture tree used ONLY when DRIVE_DEMO_MODE=true and no real Drive
 * credentials are configured. This lets the whole app (admin + public) be
 * exercised end-to-end without a Google account.
 *
 * Clearly separated from production Google Drive data: the SyncAlbum job
 * consults this provider only in demo mode.
 *
 * Images use picsum.photos (public placeholder service) so the gallery,
 * viewer, lazy-loading and themes can all be demonstrated with real pixels.
 */
class DemoDriveData
{
    /**
     * A realistic wedding folder tree:
     *   root
     *     Wedding/ { Bride Portraits, Groom Portraits, Ceremony, Couple Shoot, Family, Candid }
     *     Engagement/ { Couple, Ring Ceremony, Family }
     *     Haldi/
     *     Mehendi/
     *     Sangeet/
     *     Reception/
     */
    public static function tree(): array
    {
        return [
            'Wedding' => ['Bride Portraits', 'Groom Portraits', 'Ceremony', 'Couple Shoot', 'Family Portraits', 'Candid Moments'],
            'Engagement' => ['Couple', 'Ring Ceremony', 'Family'],
            'Haldi' => ['Bride', 'Groom', 'Family'],
            'Mehendi' => ['Bride', 'Friends'],
            'Sangeet' => [],
            'Reception' => [],
        ];
    }

    /** Deterministic photo count for a given folder path (varied but stable). */
    public static function photoCount(string $seed): int
    {
        $n = crc32($seed);

        return 8 + ($n % 15); // 8..22 photos
    }

    /**
     * Build fake photo records for a folder path.
     *
     * @return array<int,array<string,mixed>>
     */
    public static function photos(string $seedPath, int $count): array
    {
        $photos = [];
        for ($i = 1; $i <= $count; $i++) {
            $picId = (abs(crc32($seedPath . '/' . $i)) % 900) + 10; // 10..909
            $fileId = 'demo-' . substr(md5($seedPath . '/' . $i), 0, 20);
            $w = 1600;
            $h = ($i % 3 === 0) ? 2000 : 1067; // mix portrait + landscape for masonry
            $photos[] = [
                'id' => $fileId,
                'name' => sprintf('%s-%03d.jpg', str_replace(' ', '_', $seedPath), $i),
                'mimeType' => 'image/jpeg',
                'size' => random_int(1_500_000, 6_000_000),
                'imageMediaMetadata' => ['width' => $w, 'height' => $h],
                'thumbnailLink' => "https://picsum.photos/id/{$picId}/{$w}/{$h}=s220",
                'createdTime' => now()->subDays($count - $i)->toIso8601String(),
                // Direct URLs the frontend can render without Drive auth.
                '_demo_thumb' => "https://picsum.photos/id/{$picId}/400/" . (int) (400 * $h / $w),
                '_demo_preview' => "https://picsum.photos/id/{$picId}/1200/" . (int) (1200 * $h / $w),
                '_demo_original' => "https://picsum.photos/id/{$picId}/{$w}/{$h}",
            ];
        }

        return $photos;
    }
}
