<?php

namespace App\Policies;

use App\Models\User;

/**
 * Authorization for Staff Management. Only super admins may manage staff
 * accounts; a staff member may always view/update their OWN profile (handled
 * by the dedicated profile endpoints, which don't go through this policy).
 *
 * Privilege-escalation guards live here too: nobody may edit/delete a
 * super_admin through staff management, and nobody may delete themselves.
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('staff.view');
    }

    public function view(User $user, User $target): bool
    {
        return $user->isAdmin() || $user->hasPermission('staff.view');
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->hasPermission('staff.create');
    }

    public function update(User $user, User $target): bool
    {
        if ($this->isProtectedTarget($user, $target)) {
            return false;
        }

        return $user->isAdmin() || $user->hasPermission('staff.update');
    }

    public function delete(User $user, User $target): bool
    {
        // Never delete yourself or another admin via staff management.
        if ($user->id === $target->id || $target->isAdmin()) {
            return false;
        }

        return $user->isAdmin() || $user->hasPermission('staff.delete');
    }

    public function changeStatus(User $user, User $target): bool
    {
        if ($this->isProtectedTarget($user, $target)) {
            return false;
        }

        return $user->isAdmin() || $user->hasPermission('staff.update');
    }

    public function resetPassword(User $user, User $target): bool
    {
        if ($this->isProtectedTarget($user, $target)) {
            return false;
        }

        return $user->isAdmin() || $user->hasPermission('staff.reset_password');
    }

    public function manageRoles(User $user): bool
    {
        // Assigning roles/permissions is an admin-only, high-trust action.
        return $user->isAdmin();
    }

    /**
     * A target is "protected" when editing it could escalate privilege: it is
     * the actor themselves (prevents self-promotion) or it is an admin and the
     * actor is not an admin.
     */
    private function isProtectedTarget(User $user, User $target): bool
    {
        if ($target->isAdmin() && ! $user->isAdmin()) {
            return true;
        }

        // A non-admin may never edit themselves through staff management
        // (they use the profile endpoints instead).
        if ($user->id === $target->id && ! $user->isAdmin()) {
            return true;
        }

        return false;
    }
}
