<?php

namespace App\Policies;

use App\Models\User;
use App\Support\Permissions;

/**
 * Authorization for staff-account management. Only administrators may manage
 * staff. Key safety rules:
 *   - A user can never delete / deactivate / demote themselves.
 *   - Only a super_admin may act on another admin or super_admin.
 *   - Staff can never be granted super_admin via the UI (enforced in request).
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() && $user->hasPermission(Permissions::STAFF_VIEW);
    }

    public function view(User $user, User $target): bool
    {
        return $user->isAdmin() && $user->hasPermission(Permissions::STAFF_VIEW);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() && $user->hasPermission(Permissions::STAFF_MANAGE);
    }

    public function update(User $user, User $target): bool
    {
        if (! $user->isAdmin() || ! $user->hasPermission(Permissions::STAFF_MANAGE)) {
            return false;
        }

        // Only a super_admin may modify another admin/super_admin account.
        if ($target->isAdmin() && ! $user->isSuperAdmin()) {
            return false;
        }

        return true;
    }

    public function delete(User $user, User $target): bool
    {
        if (! $user->isAdmin() || ! $user->hasPermission(Permissions::STAFF_MANAGE)) {
            return false;
        }

        // Never delete yourself.
        if ($user->id === $target->id) {
            return false;
        }

        // A super_admin account can only be deleted by another super_admin.
        if ($target->isSuperAdmin() && ! $user->isSuperAdmin()) {
            return false;
        }

        return true;
    }

    /** Change another account's status (active/inactive/suspended). */
    public function changeStatus(User $user, User $target): bool
    {
        // Cannot change your own status; otherwise same rules as update.
        if ($user->id === $target->id) {
            return false;
        }

        return $this->update($user, $target);
    }

    /** Reset another account's password. */
    public function resetPassword(User $user, User $target): bool
    {
        return $this->update($user, $target);
    }
}
