<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\AdminUserResource;
use App\Services\AuditLogger;
use App\Services\AvatarStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Self-service profile management for the authenticated user (admin OR staff).
 * A user may update ONLY their own name/email/avatar/password here — never
 * their role, status, or permissions (no self privilege-escalation).
 */
class ProfileController extends Controller
{
    public function __construct(
        private readonly AvatarStorage $avatars,
        private readonly AuditLogger $audit,
    ) {}

    /** View own account information. */
    public function show(Request $request): JsonResponse
    {
        return (new AdminUserResource($request->user()))->response();
    }

    /** Update own name / email / profile photo. */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $changed = [];

        foreach (['name', 'email'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== $user->{$field}) {
                $user->{$field} = $data[$field];
                $changed[] = $field;
            }
        }

        if ($request->boolean('remove_avatar')) {
            $this->avatars->remove($user);
            $changed[] = 'avatar_removed';
        } elseif ($request->hasFile('avatar')) {
            $this->avatars->store($user, $request->file('avatar'));
            $changed[] = 'avatar';
        }

        $user->save();

        if ($changed) {
            $this->audit->log('profile.updated', $user, $user, ['fields' => $changed], $request);
        }

        return (new AdminUserResource($user->fresh()))->response();
    }

    /** Change own password (requires current password unless forced first-login). */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        // Re-authenticate with the current password (skipped on forced change).
        if (! $user->must_change_password) {
            if (! Hash::check($data['current_password'] ?? '', $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password is incorrect.'],
                ]);
            }
        }

        $user->password = $data['password']; // auto-hashed via cast
        $user->must_change_password = false;
        $user->save();

        // Invalidate all OTHER tokens so other sessions are logged out, but keep
        // the current one so the SPA stays signed in.
        $currentId = $user->currentAccessToken()?->id;
        $user->tokens()->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))->delete();

        $this->audit->log('password.changed', $user, $user, [], $request);

        return response()->json(['message' => 'Password updated successfully.']);
    }
}
