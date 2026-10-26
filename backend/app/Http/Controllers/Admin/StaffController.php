<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\AvatarStorage;
use App\Support\Permissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Staff account management. Admin-only (authorized via UserPolicy + the
 * staff.manage / staff.view permissions). All sensitive actions are recorded
 * to the audit log; passwords are only ever stored as hashes.
 */
class StaffController extends Controller
{
    public function __construct(
        private readonly AvatarStorage $avatars,
        private readonly AuditLogger $audit,
    ) {}

    /** List staff with search + role/status filters (paginated). */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()
            ->where('role', '!=', Permissions::ROLE_SUPER_ADMIN)
            ->latest();

        if ($search = trim((string) $request->query('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->query('role')) {
            $query->where('role', $role);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        return AdminUserResource::collection($query->paginate(15))->response();
    }

    /** Role + permission catalog for the UI pickers. */
    public function meta(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return response()->json([
            'roles' => Permissions::assignableRoles(),
            'statuses' => Permissions::allStatuses(),
            'permissions' => Permissions::catalog(),
            'role_defaults' => collect(Permissions::assignableRoles())
                ->mapWithKeys(fn ($r) => [$r => Permissions::defaultsForRole($r)]),
        ]);
    }

    public function show(User $staff): JsonResponse
    {
        $this->authorize('view', $staff);

        return (new AdminUserResource($staff))->response();
    }

    /** Create a staff account with unique credentials + a temp password. */
    public function store(StoreStaffRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Generate a temporary password if the admin did not set one.
        $generated = empty($data['password']);
        $tempPassword = $data['password'] ?? $this->generateTempPassword();

        $permissions = $data['permissions'] ?? Permissions::defaultsForRole($data['role']);

        $staff = new User([
            'name' => $data['name'],
            'email' => $data['email'],
            'role' => $data['role'],
            'status' => $data['status'] ?? Permissions::STATUS_ACTIVE,
            'permissions' => array_values(array_unique($permissions)),
            'must_change_password' => true, // force change on first login
            'created_by' => $request->user()->id,
        ]);
        $staff->password = $tempPassword; // auto-hashed via cast

        if ($request->hasFile('avatar')) {
            $this->avatars->store($staff, $request->file('avatar'));
        }

        $staff->save();

        $this->audit->log('staff.created', $request->user(), $staff, [
            'role' => $staff->role,
            'generated_password' => $generated,
        ], $request);

        // Return the temp password ONCE so the admin can share it. It is never
        // stored or retrievable again (only the hash is persisted).
        return (new AdminUserResource($staff))
            ->additional(['temporary_password' => $tempPassword])
            ->response()
            ->setStatusCode(201);
    }

    /** Edit staff details (name/email/role/status/permissions/avatar). */
    public function update(UpdateStaffRequest $request, User $staff): JsonResponse
    {
        $data = $request->validated();
        $changed = [];

        foreach (['name', 'email', 'role', 'status'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== $staff->{$field}) {
                $staff->{$field} = $data[$field];
                $changed[] = $field;
            }
        }

        if (array_key_exists('permissions', $data)) {
            $staff->permissions = array_values(array_unique($data['permissions']));
            $changed[] = 'permissions';
        }

        if ($request->boolean('remove_avatar')) {
            $this->avatars->remove($staff);
            $changed[] = 'avatar_removed';
        } elseif ($request->hasFile('avatar')) {
            $this->avatars->store($staff, $request->file('avatar'));
            $changed[] = 'avatar';
        }

        $staff->save();

        if ($changed) {
            $this->audit->log('staff.updated', $request->user(), $staff, ['fields' => $changed], $request);
        }

        return (new AdminUserResource($staff->fresh()))->response();
    }

    /** Change account status (active | inactive | suspended). */
    public function updateStatus(Request $request, User $staff): JsonResponse
    {
        $this->authorize('changeStatus', $staff);

        $data = $request->validate([
            'status' => ['required', Rule::in(Permissions::allStatuses())],
        ]);

        $staff->status = $data['status'];
        $staff->save();

        // Deactivating/suspending revokes all active tokens immediately.
        if ($staff->status !== Permissions::STATUS_ACTIVE) {
            $staff->tokens()->delete();
        }

        $this->audit->log('staff.status_changed', $request->user(), $staff, [
            'status' => $staff->status,
        ], $request);

        return (new AdminUserResource($staff->fresh()))->response();
    }

    /** Reset a staff member's password to a new temp password (returned once). */
    public function resetPassword(Request $request, User $staff): JsonResponse
    {
        $this->authorize('resetPassword', $staff);

        $tempPassword = $this->generateTempPassword();
        $staff->password = $tempPassword; // auto-hashed
        $staff->must_change_password = true;
        $staff->save();

        // Force re-login with the new temp password.
        $staff->tokens()->delete();

        $this->audit->log('staff.password_reset', $request->user(), $staff, [], $request);

        return response()->json([
            'message' => 'Temporary password generated.',
            'temporary_password' => $tempPassword,
        ]);
    }

    /** Delete a staff account (audit record is preserved via label snapshot). */
    public function destroy(Request $request, User $staff): JsonResponse
    {
        $this->authorize('delete', $staff);

        if ($staff->isSuperAdmin()) {
            throw ValidationException::withMessages([
                'staff' => ['Super admin accounts cannot be deleted.'],
            ]);
        }

        // Snapshot label BEFORE delete so the audit trail survives.
        $this->audit->log('staff.deleted', $request->user(), $staff, [
            'role' => $staff->role,
        ], $request);

        $this->avatars->remove($staff);
        $staff->tokens()->delete();
        $staff->delete();

        return response()->json(['message' => 'Staff account deleted.']);
    }

    /** A readable, strong temporary password. */
    private function generateTempPassword(): string
    {
        // e.g. "Mf-7fK2-a9QZ" — letters + numbers, satisfies the password rule.
        return 'Mf-'.Str::upper(Str::random(1)).Str::random(3).'-'.Str::random(2).random_int(10, 99);
    }
}
