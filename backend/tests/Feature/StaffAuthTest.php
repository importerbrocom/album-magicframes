<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use App\Notifications\ResetPasswordNotification;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StaffAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolePermissionSeeder::class);
    }

    private function staff(array $attrs = []): User
    {
        $role = Role::where('slug', 'photographer')->first();

        return User::create(array_merge([
            'name' => 'Staff',
            'email' => 'staff@test.dev',
            'role' => 'photographer',
            'role_id' => $role->id,
            'status' => 'active',
            'password' => Hash::make('TempPass12'),
        ], $attrs));
    }

    public function test_staff_can_log_in_and_receives_must_change_flag(): void
    {
        $this->staff(['must_change_password' => true]);

        $this->postJson('/api/admin/login', ['email' => 'staff@test.dev', 'password' => 'TempPass12'])
            ->assertOk()
            ->assertJsonPath('user.must_change_password', true)
            ->assertJsonStructure(['token', 'user' => ['id', 'role', 'permissions']]);

        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.login']);
    }

    public function test_suspended_staff_cannot_log_in(): void
    {
        $this->staff(['status' => 'suspended']);

        $this->postJson('/api/admin/login', ['email' => 'staff@test.dev', 'password' => 'TempPass12'])
            ->assertStatus(422);
    }

    public function test_first_login_locks_dashboard_until_password_changed(): void
    {
        $staff = $this->staff(['must_change_password' => true]);
        Sanctum::actingAs($staff);

        // Dashboard is locked (423) until the password is changed.
        $this->getJson('/api/admin/dashboard')->assertStatus(423);

        // But me/profile/password endpoints remain reachable.
        $this->getJson('/api/admin/me')->assertOk();

        $this->postJson('/api/admin/profile/password', [
            'current_password' => 'TempPass12',
            'password' => 'BrandNew123',
            'password_confirmation' => 'BrandNew123',
        ])->assertOk();

        // Now the dashboard is reachable.
        $this->getJson('/api/admin/dashboard')->assertOk();
    }

    public function test_suspended_token_is_rejected_by_account_active_middleware(): void
    {
        $staff = $this->staff();
        Sanctum::actingAs($staff);
        $this->getJson('/api/admin/dashboard')->assertOk();

        $staff->update(['status' => 'suspended']);
        $this->getJson('/api/admin/dashboard')->assertStatus(403);
    }

    public function test_forgot_password_sends_reset_notification(): void
    {
        Notification::fake();
        $staff = $this->staff();

        $this->postJson('/api/admin/forgot-password', ['email' => 'staff@test.dev'])->assertOk();

        Notification::assertSentTo($staff, ResetPasswordNotification::class);
    }

    public function test_reset_password_with_valid_token(): void
    {
        $staff = $this->staff();
        $token = Password::createToken($staff);

        $this->postJson('/api/admin/reset-password', [
            'token' => $token,
            'email' => 'staff@test.dev',
            'password' => 'ResetPass123',
            'password_confirmation' => 'ResetPass123',
        ])->assertOk();

        $this->assertTrue(Hash::check('ResetPass123', $staff->refresh()->password));
    }

    public function test_logout_revokes_token(): void
    {
        Sanctum::actingAs($this->staff());

        $this->postJson('/api/admin/logout')->assertOk();
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.logout']);
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/admin/staff')->assertStatus(401);
        $this->getJson('/api/admin/profile')->assertStatus(401);
        $this->getJson('/api/admin/roles')->assertStatus(401);
        $this->getJson('/api/admin/audit-logs')->assertStatus(401);
    }
}
