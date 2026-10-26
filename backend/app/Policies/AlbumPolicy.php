<?php

namespace App\Policies;

use App\Models\Album;
use App\Models\User;

/**
 * Authorization for admin-side album management. Super admins manage everything;
 * other roles are gated by granular permissions (albums.*) AND ownership. The
 * legacy hasRole() checks are preserved as a fallback so nothing breaks if
 * permissions have not been seeded.
 */
class AlbumPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin()
            || $user->hasPermission('albums.view')
            || $user->hasRole('photographer', 'editor', 'assistant');
    }

    public function view(User $user, Album $album): bool
    {
        if (! ($user->isAdmin() || $user->hasPermission('albums.view')
            || $user->hasRole('photographer', 'editor', 'assistant'))) {
            return false;
        }

        return $this->owns($user, $album);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin()
            || $user->hasPermission('albums.create')
            || $user->hasRole('super_admin', 'photographer', 'editor');
    }

    public function update(User $user, Album $album): bool
    {
        if (! ($user->isAdmin() || $user->hasPermission('albums.update')
            || $user->hasRole('super_admin', 'photographer', 'editor'))) {
            return false;
        }

        return $this->owns($user, $album);
    }

    public function delete(User $user, Album $album): bool
    {
        if (! ($user->isAdmin() || $user->hasPermission('albums.delete')
            || $user->hasRole('super_admin', 'photographer'))) {
            return false;
        }

        return $this->owns($user, $album);
    }

    private function owns(User $user, Album $album): bool
    {
        // Super admins manage all albums; others only their own.
        if ($user->isAdmin()) {
            return true;
        }

        return $album->user_id === null || $album->user_id === $user->id;
    }
}
