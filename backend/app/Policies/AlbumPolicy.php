<?php

namespace App\Policies;

use App\Models\Album;
use App\Models\User;
use App\Support\Permissions;

/**
 * Authorization for admin-side album management.
 *
 * Admins (super_admin / admin) manage everything. Staff are authorized by
 * their granular permissions (albums.view/create/update/delete) AND, for
 * row-level actions, by ownership of the album.
 */
class AlbumPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermission(Permissions::ALBUMS_VIEW);
    }

    public function view(User $user, Album $album): bool
    {
        return $user->hasPermission(Permissions::ALBUMS_VIEW) && $this->owns($user, $album);
    }

    public function create(User $user): bool
    {
        return $user->hasPermission(Permissions::ALBUMS_CREATE);
    }

    public function update(User $user, Album $album): bool
    {
        return $user->hasPermission(Permissions::ALBUMS_UPDATE) && $this->owns($user, $album);
    }

    public function delete(User $user, Album $album): bool
    {
        return $user->hasPermission(Permissions::ALBUMS_DELETE) && $this->owns($user, $album);
    }

    private function owns(User $user, Album $album): bool
    {
        // Admins manage all albums; others only their own (or unassigned).
        if ($user->isAdmin()) {
            return true;
        }

        return $album->user_id === null || $album->user_id === $user->id;
    }
}
