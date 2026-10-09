<?php

namespace Tests\Feature;

use App\Jobs\SyncAlbumFromGoogleDrive;
use App\Models\Album;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PublicAlbumFlowTest extends TestCase
{
    use RefreshDatabase;

    private function demoAlbum(): Album
    {
        $album = Album::create([
            'client_name' => 'Rahul & Anjali',
            'title' => 'Our Wedding Journey',
            'slug' => 'rahul-anjali-test01',
            'password_hash' => Hash::make('RA2026'),
            'google_drive_url' => 'https://drive.google.com/drive/folders/DEMO',
            'google_drive_folder_id' => 'DEMO',
            'drive_auth_mode' => 'demo',
            'status' => 'active',
            'theme' => 'classic',
            'allow_download' => true,
            'allow_share' => true,
        ]);

        // Run the demo sync inline (QUEUE_CONNECTION=sync in tests).
        SyncAlbumFromGoogleDrive::dispatchSync($album->id);

        return $album->fresh();
    }

    public function test_landing_is_public_and_hides_secrets(): void
    {
        $album = $this->demoAlbum();

        $res = $this->getJson("/api/public/albums/{$album->slug}/landing");

        $res->assertOk()
            ->assertJsonPath('client_name', 'Rahul & Anjali')
            ->assertJsonMissing(['password_hash'])
            ->assertJsonMissing(['google_drive_folder_id']);
    }

    public function test_wrong_password_is_rejected(): void
    {
        $album = $this->demoAlbum();

        $this->postJson("/api/public/albums/{$album->slug}/verify", ['password' => 'nope'])
            ->assertStatus(401);
    }

    public function test_correct_password_issues_token_and_grants_access(): void
    {
        $album = $this->demoAlbum();

        $verify = $this->postJson("/api/public/albums/{$album->slug}/verify", ['password' => 'RA2026']);
        $verify->assertOk();
        $token = $verify->json('access.token');
        $this->assertNotEmpty($token);

        // Events require the token.
        $this->getJson("/api/public/albums/{$album->slug}/events")->assertStatus(401);

        $events = $this->getJson("/api/public/albums/{$album->slug}/events", [
            'Authorization' => "Bearer {$token}",
        ]);
        $events->assertOk()->assertJsonStructure(['data' => [['id', 'name', 'slug', 'photo_count']]]);
        $this->assertGreaterThan(0, count($events->json('data')));
    }

    public function test_album_token_cannot_access_a_different_album(): void
    {
        $albumA = $this->demoAlbum();

        $albumB = Album::create([
            'client_name' => 'Other Couple',
            'title' => 'Other Album',
            'slug' => 'other-couple-test02',
            'password_hash' => Hash::make('OTHER'),
            'drive_auth_mode' => 'demo',
            'status' => 'active',
        ]);

        $token = $this->postJson("/api/public/albums/{$albumA->slug}/verify", ['password' => 'RA2026'])
            ->json('access.token');

        // Using album A's token against album B must be rejected.
        $this->getJson("/api/public/albums/{$albumB->slug}/events", [
            'Authorization' => "Bearer {$token}",
        ])->assertStatus(401);
    }

    public function test_photos_are_paginated(): void
    {
        $album = $this->demoAlbum();
        $token = $this->postJson("/api/public/albums/{$album->slug}/verify", ['password' => 'RA2026'])
            ->json('access.token');

        $res = $this->getJson("/api/public/albums/{$album->slug}/photos?per_page=5", [
            'Authorization' => "Bearer {$token}",
        ]);

        $res->assertOk()->assertJsonStructure(['data', 'meta' => ['current_page', 'last_page', 'total']]);
        $this->assertLessThanOrEqual(5, count($res->json('data')));
    }
}
