<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Staff account management (admin only — gated by the admin.only middleware).
 *
 * Staff are plain users with role = "staff". An admin creates them with an
 * email + password, can edit their details, suspend/activate them, reset their
 * password, and delete them. Staff accounts are flagged must_change_password on
 * creation and on password reset so they set their own password on first login.
 */
class StaffController extends Controller
{
    /** List staff with optional search (name/email) and status filter. */
    public function index(Request $request): JsonResponse
    {
        $query = User::where('role', 'staff')->orderByDesc('created_at');

        if ($search = trim((string) $request->query('q', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            if (in_array($status, [User::STATUS_ACTIVE, User::STATUS_SUSPENDED], true)) {
                $query->where('status', $status);
            }
        }

        return response()->json([
            'data' => $query->get()->map->toAuthArray(),
        ]);
    }

    /** Create a new staff account with email + temporary password. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => 'staff',
            'status' => User::STATUS_ACTIVE,
            'must_change_password' => true,
            'created_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Staff member created.',
            'data' => $user->toAuthArray(),
        ], 201);
    }

    public function show(Request $request, User $staff): JsonResponse
    {
        $this->assertStaff($staff);

        return response()->json(['data' => $staff->toAuthArray()]);
    }

    /** Edit a staff member's name/email and optionally their status. */
    public function update(Request $request, User $staff): JsonResponse
    {
        $this->assertStaff($staff);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($staff->id)],
            'status' => ['sometimes', 'required', Rule::in([User::STATUS_ACTIVE, User::STATUS_SUSPENDED])],
        ]);

        $staff->update($data);

        // If suspended, revoke active tokens so the session ends immediately.
        if (($data['status'] ?? null) === User::STATUS_SUSPENDED) {
            $staff->tokens()->delete();
        }

        return response()->json([
            'message' => 'Staff member updated.',
            'data' => $staff->fresh()->toAuthArray(),
        ]);
    }

    /** Set a new temporary password; forces change on next login. */
    public function resetPassword(Request $request, User $staff): JsonResponse
    {
        $this->assertStaff($staff);

        $data = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $staff->update([
            'password' => $data['password'],
            'must_change_password' => true,
        ]);

        // Force re-login with the new temporary password.
        $staff->tokens()->delete();

        return response()->json(['message' => 'Password reset. The staff member must change it on next login.']);
    }

    public function destroy(Request $request, User $staff): JsonResponse
    {
        $this->assertStaff($staff);

        $staff->tokens()->delete();
        $staff->delete();

        return response()->json(['message' => 'Staff member deleted.']);
    }

    /** Guard: route-model binding must resolve a staff user, not an admin. */
    private function assertStaff(User $staff): void
    {
        abort_if($staff->role !== 'staff', 404, 'Staff member not found.');
    }
}
