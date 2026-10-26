<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Http\Resources\StaffResource;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use App\Services\AvatarService;
use App\Services\StaffService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Admin-only Staff Management. Every route is additionally protected by the
 * UserPolicy (authorize calls) so authorization is enforced server-side, not
 * just by the route middleware.
 */
class StaffController extends Controller
{
    public function __construct(
        private StaffService $staff,
        private AvatarService $avatars,
        private AuditService $audit,
    ) {
    }

    /** Paginated, searchable, filterable list of staff accounts. */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()->with('roleModel')->orderByDesc('created_at');

        if ($q = trim((string) $request->query('q'))) {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        // Exclude the acting admin's own row from the staff list by default?
        // No — admins may appear; but the UI focuses on non-admin staff. We keep
        // everyone visible for transparency and let the client filter.

        $staff = $query->paginate(15)->withQueryString();

        return StaffResource::collection($staff)->response();
    }

    public function show(User $staff): JsonResponse
    {
        $this->authorize('view', $staff);

        return (new StaffResource($staff->load('roleModel', 'permissions')))->response();
    }

    /** Create a staff member and generate login credentials. */
    public function store(StoreStaffRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validated();
        $role = Role::findOrFail($data['role_id']);

        // Guard: creating another super_admin via staff management is not allowed.
        if ($role->slug === 'super_admin') {
            throw ValidationException::withMessages([
                'role_id' => ['Super admin accounts cannot be created from staff management.'],
            ]);
        }

        $plainPassword = $data['password'] ?? $this->staff->generateTemporaryPassword();
        $generated = ! isset($data['password']);

        $user = new User([
            'name' => $data['name'],
            'email' => $data['email'],
            'status' => $data['status'] ?? 'active',
            // Force a change on first login unless an explicit permanent password
            // was supplied AND the admin opted out.
            'must_change_password' => $data['must_change_password'] ?? true,
            'invited_by' => $request->user()->id,
        ]);
        $user->password = $plainPassword; // hashed via cast
        $this->staff->syncRole($user, $role);
        $user->save();

        if ($request->hasFile('avatar')) {
            $user->avatar_path = $this->avatars->store($user, $request->file('avatar'));
            $user->save();
        }

        if (! empty($data['permissions'])) {
            $this->staff->syncPermissionOverrides($user, $data['permissions']);
        }

        $this->audit->log($request->user(), 'staff.created', $user, [
            'role' => $role->slug,
            'password_generated' => $generated,
        ]);

        return (new StaffResource($user->load('roleModel')))
            ->additional([
                'message' => 'Staff member created.',
                // Returned ONCE so the admin can hand over the temp credentials.
                // Never stored in plain text and never retrievable again.
                'credentials' => [
                    'email' => $user->email,
                    'temporary_password' => $plainPassword,
                    'must_change_password' => (bool) $user->must_change_password,
                ],
            ])
            ->response()
            ->setStatusCode(201);
    }

    /** Edit staff details (name, email, role, status, avatar, permissions). */
    public function update(UpdateStaffRequest $request, User $staff): JsonResponse
    {
        $this->authorize('update', $staff);

        $data = $request->validated();

        if (isset($data['role_id'])) {
            $role = Role::findOrFail($data['role_id']);
            if ($role->slug === 'super_admin') {
                throw ValidationException::withMessages([
                    'role_id' => ['Staff cannot be promoted to super admin here.'],
                ]);
            }
            $this->staff->syncRole($staff, $role);
        }

        foreach (['name', 'email', 'status'] as $field) {
            if (array_key_exists($field, $data)) {
                $staff->{$field} = $data[$field];
            }
        }

        if ($request->boolean('remove_avatar')) {
            $this->avatars->remove($staff);
            $staff->avatar_path = null;
        } elseif ($request->hasFile('avatar')) {
            $staff->avatar_path = $this->avatars->store($staff, $request->file('avatar'));
        }

        $staff->save();

        if (array_key_exists('permissions', $data)) {
            $this->staff->syncPermissionOverrides($staff, $data['permissions'] ?? []);
        }

        $this->audit->log($request->user(), 'staff.updated', $staff, [
            'changed' => array_keys($data),
        ]);

        return (new StaffResource($staff->refresh()->load('roleModel', 'permissions')))
            ->additional(['message' => 'Staff member updated.'])
            ->response();
    }

    /** Activate / deactivate / suspend a staff account. */
    public function updateStatus(Request $request, User $staff): JsonResponse
    {
        $this->authorize('changeStatus', $staff);

        $data = $request->validate([
            'status' => ['required', Rule::in(['active', 'inactive', 'suspended'])],
        ]);

        $staff->status = $data['status'];
        $staff->save();

        // Revoke active sessions when disabling access.
        if ($data['status'] !== 'active') {
            $staff->tokens()->delete();
        }

        $this->audit->log($request->user(), 'staff.status_changed', $staff, [
            'status' => $data['status'],
        ]);

        return (new StaffResource($staff->refresh()->load('roleModel')))
            ->additional(['message' => "Staff status set to {$data['status']}."])
            ->response();
    }

    /**
     * Reset a staff member's password. Either generate a new temporary password
     * (returned once) or email a secure reset link, depending on the request.
     */
    public function resetPassword(Request $request, User $staff): JsonResponse
    {
        $this->authorize('resetPassword', $staff);

        $mode = $request->input('mode', 'temporary'); // temporary | link

        if ($mode === 'link') {
            Password::sendResetLink(['email' => $staff->email]);

            $this->audit->log($request->user(), 'staff.password_reset', $staff, ['mode' => 'link']);

            return response()->json([
                'message' => 'A password reset link has been sent to the staff member.',
            ]);
        }

        $plainPassword = $this->staff->generateTemporaryPassword();
        $staff->password = $plainPassword;
        $staff->must_change_password = true;
        $staff->save();
        $staff->tokens()->delete(); // force re-login with the new temp password

        $this->audit->log($request->user(), 'staff.password_reset', $staff, ['mode' => 'temporary']);

        return response()->json([
            'message' => 'Temporary password generated.',
            'credentials' => [
                'email' => $staff->email,
                'temporary_password' => $plainPassword,
                'must_change_password' => true,
            ],
        ]);
    }

    /** Delete a staff account; the audit trail is preserved. */
    public function destroy(Request $request, User $staff): JsonResponse
    {
        $this->authorize('delete', $staff);

        $label = $staff->email;
        $this->avatars->remove($staff);
        $staff->tokens()->delete();

        // Snapshot before deletion so the audit log keeps meaningful context.
        $this->audit->log($request->user(), 'staff.deleted', $staff, [
            'email' => $label,
            'role' => $staff->role,
        ]);

        $staff->delete();

        return response()->json(['message' => "Staff member {$label} deleted."]);
    }
}
