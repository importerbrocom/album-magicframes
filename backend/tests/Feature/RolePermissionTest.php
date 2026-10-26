<?php

namespace Tests\Feature;

use App\Models\Album;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function user(string $role): User
    {
        $roleModel = Role::where('slug', $role)->first();

        return User::create([
            'name' => ucfirst($role),
            'email' => "{$role}@test.dev",
            'role' => $role,
            'role_id' => $roleModel->id,
            'status' => 'active',
            'password' => Hash::make('secret12A'),
        ]);
    }

    public function test_super_admin_has_all_permissions(): void
    {
        $admin = $this->user('super_admin');
        $this->assertTrue($admin->hasPermission('staff.delete'));
        $this->assertTrue($admin->hasPermission('albums.create'));
    }

    public function test_assistant_is_read_only_on_albums(): void
    {
        $assistant = $this->user('assistant');
        $this->assertTrue($assistant->hasPermission('albums.view'));
        $this->assertFalse($assistant->hasPermission('albums.create'));
        $this->assertFalse($assistant->hasPermission('staff.view'));
    }

    public function test_permission_override_grants_extra_permission(): void
    {
        $assistant = $this->user('assistant');
        $this->assertFalse($assistant->hasPermission('albums.create'));

        app(\App\Services\StaffService::class)->syncPermissionOverrides($assistant, ['albums.create']);

        $this->assertTrue($assistant->fresh()->hasPermission('albums.create'));
    }

    public function test_assistant_cannot_create_albums_via_api(): void
    {
        Sanctum::actingAs($this->user('assistant'));

        $this->postJson('/api/admin/albums', [
            'client_name' => 'X', 'title' => 'Y',
            'google_drive_url' => 'https://drive.google.com/drive/folders/1ABC',
            'password' => 'pass12',
        ])->assertStatus(403);
    }

    public function test_photographer_can_create_albums_via_api(): void
    {
        Sanctum::actingAs($this->user('photographer'));

        $this->postJson('/api/admin/albums', [
            'client_name' => 'X', 'title' => 'Y',
            'google_drive_url' => 'https://drive.google.com/drive/folders/1ABC',
            'password' => 'pass12',
        ])->assertStatus(201);
    }

    public function test_staff_cannot_access_roles_or_audit_logs(): void
    {
        Sanctum::actingAs($this->user('photographer'));

        $this->getJson('/api/admin/roles')->assertStatus(403);
        $this->getJson('/api/admin/audit-logs')->assertStatus(403);
    }

    public function test_admin_can_update_role_permissions(): void
    {
        Sanctum::actingAs($this->user('super_admin'));
        $role = Role::where('slug', 'assistant')->first();

        $this->putJson("/api/admin/roles/{$role->id}", [
            'permissions' => ['albums.view', 'albums.create', 'analytics.view'],
        ])->assertOk();

        $this->assertTrue($role->fresh()->permissions->pluck('slug')->contains('albums.create'));
    }

    public function test_super_admin_role_permissions_cannot_be_modified(): void
    {
        Sanctum::actingAs($this->user('super_admin'));
        $role = Role::where('slug', 'super_admin')->first();

        $this->putJson("/api/admin/roles/{$role->id}", ['permissions' => []])
            ->assertStatus(422);
    }

    public function test_photographer_only_sees_own_albums_on_dashboard(): void
    {
        $photographer = $this->user('photographer');
        $other = $this->user('editor');

        Album::create([
            'user_id' => $photographer->id, 'client_name' => 'Mine', 'title' => 'T',
            'slug' => 'mine-123', 'password_hash' => Hash::make('x'),
        ]);
        Album::create([
            'user_id' => $other->id, 'client_name' => 'Theirs', 'title' => 'T',
            'slug' => 'theirs-123', 'password_hash' => Hash::make('x'),
        ]);

        Sanctum::actingAs($photographer);
        $this->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('stats.total_albums', 1)
            ->assertJsonPath('is_admin', false);
    }
}
