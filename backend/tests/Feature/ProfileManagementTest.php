<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin',
            'email' => 'admin@test.dev',
            'role' => 'super_admin',
            'status' => 'active',
            'password' => Hash::make('secret12A'),
        ]);
    }

    public function test_user_can_view_own_profile(): void
    {
        Sanctum::actingAs($user = $this->admin());

        $this->getJson('/api/admin/profile')
            ->assertOk()
            ->assertJsonPath('data.email', 'admin@test.dev')
            ->assertJsonPath('data.role', 'super_admin')
            ->assertJsonStructure(['data' => ['id', 'name', 'email', 'role', 'permissions']]);
    }

    public function test_user_can_update_name_and_email(): void
    {
        Sanctum::actingAs($this->admin());

        $this->putJson('/api/admin/profile', ['name' => 'New Name', 'email' => 'new@test.dev'])
            ->assertOk()
            ->assertJsonPath('data.name', 'New Name');

        $this->assertDatabaseHas('users', ['email' => 'new@test.dev', 'name' => 'New Name']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'profile.updated']);
    }

    public function test_user_can_upload_and_remove_avatar(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($user = $this->admin());

        $this->postJson('/api/admin/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('me.jpg', 200, 200),
        ])->assertOk();

        $user->refresh();
        $this->assertNotNull($user->avatar_path);
        Storage::disk('public')->assertExists($user->avatar_path);

        $this->deleteJson('/api/admin/profile/avatar')->assertOk();
        $this->assertNull($user->refresh()->avatar_path);
    }

    public function test_avatar_rejects_non_image_and_oversized(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/admin/profile/avatar', [
            'avatar' => UploadedFile::fake()->create('virus.pdf', 100, 'application/pdf'),
        ])->assertStatus(422);

        $this->postJson('/api/admin/profile/avatar', [
            'avatar' => UploadedFile::fake()->image('huge.jpg')->size(6000), // 6 MB
        ])->assertStatus(422);
    }

    public function test_change_password_requires_correct_current_password(): void
    {
        Sanctum::actingAs($this->admin());

        $this->postJson('/api/admin/profile/password', [
            'current_password' => 'wrongpass',
            'password' => 'NewPass123',
            'password_confirmation' => 'NewPass123',
        ])->assertStatus(422);
    }

    public function test_change_password_succeeds_and_clears_must_change_flag(): void
    {
        $user = $this->admin();
        $user->update(['must_change_password' => true]);
        Sanctum::actingAs($user);

        $this->postJson('/api/admin/profile/password', [
            'current_password' => 'secret12A',
            'password' => 'NewPass123',
            'password_confirmation' => 'NewPass123',
        ])->assertOk();

        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('NewPass123', $user->password));
    }
}
