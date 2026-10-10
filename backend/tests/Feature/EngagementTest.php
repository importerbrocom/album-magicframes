<?php

namespace Tests\Feature;

use App\Models\Album;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EngagementTest extends TestCase
{
    use RefreshDatabase;

    private function album(array $overrides = []): Album
    {
        return Album::create(array_merge([
            'client_name' => 'Rahul & Anjali',
            'title' => 'Our Wedding Journey',
            'slug' => 'rahul-anjali-eng01',
            'password_hash' => Hash::make('RA2026'),
            'drive_auth_mode' => 'demo',
            'status' => 'active',
            'allow_comments' => true,
            'allow_enquiries' => true,
        ], $overrides));
    }

    public function test_anyone_can_comment_without_the_album_token(): void
    {
        $album = $this->album();

        // No Authorization header at all — simulates a reshared-link visitor.
        $this->postJson("/api/public/albums/{$album->slug}/comments", [
            'name' => 'Priya',
            'body' => 'Beautiful photos!',
        ])->assertStatus(201)->assertJsonPath('name', 'Priya');

        $this->getJson("/api/public/albums/{$album->slug}/comments")
            ->assertOk()
            ->assertJsonPath('data.0.body', 'Beautiful photos!');
    }

    public function test_comment_requires_name_and_body(): void
    {
        $album = $this->album();
        $this->postJson("/api/public/albums/{$album->slug}/comments", ['name' => 'X'])
            ->assertStatus(422);
    }

    public function test_comments_can_be_disabled(): void
    {
        $album = $this->album(['slug' => 'no-comments-01', 'allow_comments' => false]);
        $this->postJson("/api/public/albums/{$album->slug}/comments", [
            'name' => 'Priya', 'body' => 'hi',
        ])->assertStatus(403);
    }

    public function test_enquiry_is_stored_and_queued(): void
    {
        $album = $this->album(['slug' => 'enq-album-01']);

        $this->postJson("/api/public/albums/{$album->slug}/enquiries", [
            'name' => 'Guest Uncle',
            'phone' => '9876543210',
            'message' => 'Want to book you.',
        ])->assertStatus(201)->assertJsonPath('ok', true);

        $this->assertDatabaseHas('enquiries', [
            'album_id' => $album->id,
            'name' => 'Guest Uncle',
            'phone' => '9876543210',
        ]);
    }

    public function test_honeypot_blocks_spam_silently(): void
    {
        $album = $this->album(['slug' => 'hp-album-01']);

        $this->postJson("/api/public/albums/{$album->slug}/comments", [
            'name' => 'Spam', 'body' => 'buy now', 'website' => 'http://spam',
        ])->assertStatus(422); // size:0 rule rejects filled honeypot

        $this->assertDatabaseMissing('comments', ['name' => 'Spam']);
    }
}
