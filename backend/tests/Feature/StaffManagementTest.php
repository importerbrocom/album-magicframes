<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function admin(): User
    {
        $role = Role::where('slug', 'super_admin')->first();

        return User::create([
            'name' => 'Admin',
            'email' => 'admin@test.dev',
            'role' => 'super_admin',
            'role_id' => $role->id,
            'status' => 'active',
            'password' => Hash::make('secret12A'),
        ]);
    }

    private function staff(string $role = 'photographer', array $attrs = []): User
    {
        $roleModel = Role::where('slug', $role)->first();

        return User::create(array_merge([
            'name' => 'Staff',
            'email' => 'staff@test.dev',
            'role' => $role,
            'role_id' => $roleModel->id,
            'status' => 'active',
            'password' => Hash::make('secret12A'),
        ], $attrs));
    }

    public function test_admin_can_create_staff_and_receives_generated_credentials(): void
    {
        Sanctum::actingAs($this->admin());
        $role = Role::where('slug', 'photographer')->first();

        $res = $this->postJson('/api/admin/staff', [
            'name' => 'Jane Doe',
            'email' => 'jane@test.dev',
            'role_id' => $role->id,
        ]);

        $res->assertStatus(201)
            ->assertJsonPath('data.email', 'jane@test.dev')
            ->assertJsonStructure(['credentials' => ['email', 'temporary_password', 'must_change_password']]);

        $this->assertTrue($res->json('credentials.must_change_password'));
        $this->assertDatabaseHas('users', ['email' => 'jane@test.dev', 'role' => 'photographer']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'staff.created']);

        // Password never stored in plain text.
        $this->assertDatabaseMissing('users', ['password' => $res->json('credentials.temporary_password')]);
    }

    public function test_cannot_create_super_admin_via_staff_management(): void
    {
        Sanctum::actingAs($this->admin());
        $role = Role::where('slug', 'super_admin')->first();

        $this->postJson('/api/admin/staff', [
            'name' => 'Sneaky',
            'email' => 'sneaky@test.dev',
            'role_id' => $role->id,
        ])->assertStatus(422);
    }

    public function test_admin_can_upload_staff_avatar_on_create(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->admin());
        $role = Role::where('slug', 'editor')->first();

        $res = $this->postJson('/api/admin/staff', [
            'name' => 'Pic Staff',
            'email' => 'pic@test.dev',
            'role_id' => $role->id,
            'avatar' => UploadedFile::fake()->image('a.png', 100, 100),
        ])->assertStatus(201);

        $user = User::where('email', 'pic@test.dev')->first();
        $this->assertNotNull($user->avatar_path);
        Storage::disk('public')->assertExists($user->avatar_path);
    }

    public function test_admin_can_change_staff_status_and_tokens_revoked(): void
    {
        Sanctum::actingAs($this->admin());
        $staff = $this->staff();
        $staff->createToken('x');

        $this->patchJson("/api/admin/staff/{$staff->id}/status", ['status' => 'suspended'])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertDatabaseHas('audit_logs', ['action' => 'staff.status_changed']);
    }

    public function test_admin_can_reset_staff_password_returns_temp_once(): void
    {
        Sanctum::actingAs($this->admin());
        $staff = $this->staff();

        $res = $this->postJson("/api/admin/staff/{$staff->id}/reset-password", ['mode' => 'temporary'])
            ->assertOk()
            ->assertJsonStructure(['credentials' => ['temporary_password']]);

        $staff->refresh();
        $this->assertTrue($staff->must_change_password);
        $this->assertTrue(Hash::check($res->json('credentials.temporary_password'), $staff->password));
    }

    public function test_admin_can_delete_staff_but_audit_is_preserved(): void
    {
        Sanctum::actingAs($this->admin());
        $staff = $this->staff();

        $this->deleteJson("/api/admin/staff/{$staff->id}")->assertOk();

        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
        $this->assertDatabaseHas('audit_logs', [
            'action' => 'staff.deleted',
            'target_label' => 'staff@test.dev',
        ]);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);

        $this->deleteJson("/api/admin/staff/{$admin->id}")->assertStatus(403);
    }

    public function test_search_and_filter_staff(): void
    {
        Sanctum::actingAs($this->admin());
        $this->staff('photographer', ['email' => 'alice@test.dev', 'name' => 'Alice']);
        $this->staff('editor', ['email' => 'bob@test.dev', 'name' => 'Bob', 'status' => 'suspended']);

        $this->getJson('/api/admin/staff?q=alice')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/admin/staff?status=suspended')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_staff_without_permission_cannot_manage_staff(): void
    {
        Sanctum::actingAs($this->staff('assistant'));

        $this->getJson('/api/admin/staff')->assertStatus(403);
        $this->postJson('/api/admin/staff', [
            'name' => 'X', 'email' => 'x@test.dev', 'role_id' => Role::where('slug', 'editor')->first()->id,
        ])->assertStatus(403);
    }
}
