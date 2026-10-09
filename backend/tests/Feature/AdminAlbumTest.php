<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAlbumTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin',
            'email' => 'admin@test.dev',
            'role' => 'super_admin',
            'password' => Hash::make('secret12'),
        ]);
    }

    public function test_login_returns_a_token(): void
    {
        $this->admin();

        $this->postJson('/api/admin/login', ['email' => 'admin@test.dev', 'password' => 'secret12'])
            ->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'email', 'role']]);
    }

    public function test_login_rejects_bad_credentials(): void
    {
        $this->admin();

        $this->postJson('/api/admin/login', ['email' => 'admin@test.dev', 'password' => 'wrong'])
            ->assertStatus(422);
    }

    public function test_admin_can_create_album_with_hashed_password_and_slug(): void
    {
        Sanctum::actingAs($this->admin());

        $res = $this->postJson('/api/admin/albums', [
            'client_name' => 'Rahul & Anjali',
            'title' => 'Our Wedding Journey',
            'google_drive_url' => 'https://drive.google.com/drive/folders/1ABCXYZ',
            'password' => 'RA2026',
            'theme' => 'modern',
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('album.client_name', 'Rahul & Anjali')
            ->assertJsonStructure(['share' => ['url', 'whatsapp', 'qr_url']]);

        $slug = $res->json('album.slug');
        $this->assertStringContainsString('rahul-anjali-', $slug);

        // Password stored hashed, folder id extracted, never plain text.
        $this->assertDatabaseHas('albums', [
            'slug' => $slug,
            'google_drive_folder_id' => '1ABCXYZ',
        ]);
        $this->assertDatabaseMissing('albums', ['password_hash' => 'RA2026']);
    }

    public function test_album_endpoints_require_authentication(): void
    {
        $this->getJson('/api/admin/albums')->assertStatus(401);
        $this->getJson('/api/admin/dashboard')->assertStatus(401);
    }
}
