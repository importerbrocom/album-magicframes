<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateAvatarRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\ProfileResource;
use App\Services\AuditService;
use App\Services\AvatarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Self-service profile management for the authenticated user (admin OR staff).
 * Everyone can manage ONLY their own account here; nobody can change their own
 * role/status/permissions (that's Staff Management, admin-only).
 */
class ProfileController extends Controller
{
    public function __construct(
        private AvatarService $avatars,
        private AuditService $audit,
    ) {
    }

    /** View own account information. */
    public function show(Request $request): JsonResponse
    {
        return (new ProfileResource($request->user()))->response();
    }

    /** Update own full name / email. */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());
        $user->save();

        $this->audit->log($user, 'profile.updated', $user, [
            'changed' => array_keys($request->validated()),
        ]);

        return (new ProfileResource($user->refresh()))
            ->additional(['message' => 'Profile updated.'])
            ->response();
    }

    /** Upload or replace own profile photo. */
    public function updateAvatar(UpdateAvatarRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->avatar_path = $this->avatars->store($user, $request->file('avatar'));
        $user->save();

        $this->audit->log($user, 'profile.avatar_updated', $user);

        return (new ProfileResource($user->refresh()))
            ->additional(['message' => 'Profile photo updated.'])
            ->response();
    }

    /** Remove own profile photo. */
    public function removeAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->avatars->remove($user);
        $user->avatar_path = null;
        $user->save();

        $this->audit->log($user, 'profile.avatar_removed', $user);

        return (new ProfileResource($user->refresh()))
            ->additional(['message' => 'Profile photo removed.'])
            ->response();
    }

    /** Change own password (requires the current password). */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->password = $request->validated()['password']; // auto-hashed via cast
        $user->must_change_password = false;
        $user->password_changed_at = now();
        $user->save();

        // Invalidate every OTHER token so a leaked temp password can't persist
        // (keep the one making this request). Guard for the transient token
        // used in tests, which has no persisted id.
        $currentId = $user->currentAccessToken()?->id;
        $query = $user->tokens();
        if ($currentId) {
            $query->where('id', '!=', $currentId);
        }
        $query->delete();

        $this->audit->log($user, 'password.changed', $user);

        return (new ProfileResource($user->refresh()))
            ->additional(['message' => 'Password changed successfully.'])
            ->response();
    }
}
