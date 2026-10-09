<?php

namespace App\Policies;

use App\Models\Album;
use App\Models\User;

/**
 * Authorization for admin-side album management. For the MVP a single admin
 * role manages everything, but this policy is the hook point for future RBAC
 * (super_admin / photographer / editor / assistant).
 */
class AlbumPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Album $album): bool
    {
        return $this->owns($user, $album);
    }

    public function create(User $user): bool
    {
        return $user->hasRole('super_admin', 'photographer', 'editor');
    }

    public function update(User $user, Album $album): bool
    {
        return $this->owns($user, $album);
    }

    public function delete(User $user, Album $album): bool
    {
        return $this->owns($user, $album) && $user->hasRole('super_admin', 'photographer');
    }

    private function owns(User $user, Album $album): bool
    {
        // Super admins manage all albums; others only their own.
        if ($user->hasRole('super_admin')) {
            return true;
        }

        return $album->user_id === null || $album->user_id === $user->id;
    }
}
