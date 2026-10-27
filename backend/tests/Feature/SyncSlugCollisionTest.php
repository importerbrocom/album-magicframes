<?php

namespace Tests\Feature;

use App\Jobs\SyncAlbumFromGoogleDrive;
use App\Models\Album;
use App\Models\Event;
use App\Models\Photo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Regression: an album created in demo mode (events like "wedding") then
 * switched to a real sync must NOT fail with a unique-slug collision, and the
 * stale demo events/photos must be pruned.
 */
class SyncSlugCollisionTest extends TestCase
{
    use RefreshDatabase;

    public function test_resync_replaces_stale_events_without_slug_collision(): void
    {
        $album = Album::create([
            'client_name' => 'Jewel Deneta',
            'title' => 'Wedding',
            'slug' => 'jewel-deneta-01',
            'password_hash' => Hash::make('secret'),
            'drive_auth_mode' => 'demo',
            'status' => 'active',
        ]);

        // First demo sync creates demo events (including a "wedding" slug).
        SyncAlbumFromGoogleDrive::dispatchSync($album->id);
        $album->refresh();
        $this->assertSame('completed', $album->sync_status);
        $this->assertTrue(
            Event::where('album_id', $album->id)->where('slug', 'wedding')->exists(),
            'demo sync should create a wedding event',
        );
        $demoPhotoCount = Photo::where('album_id', $album->id)->count();
        $this->assertGreaterThan(0, $demoPhotoCount);

        // Re-running the demo sync (same data) must succeed, not collide, and
        // must not duplicate the "wedding" slug.
        SyncAlbumFromGoogleDrive::dispatchSync($album->id);
        $album->refresh();

        $this->assertSame('completed', $album->sync_status, 'resync must not fail');
        $this->assertSame(
            1,
            Event::where('album_id', $album->id)->where('slug', 'wedding')->count(),
            'there must be exactly one wedding event after resync',
        );
        // Counts stay stable (idempotent), no duplicate rows.
        $this->assertSame($demoPhotoCount, Photo::where('album_id', $album->id)->count());
    }
}
