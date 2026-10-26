<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Business logic for creating/updating staff accounts: temporary-password
 * generation, role/string-role syncing, and per-user permission overrides.
 */
class StaffService
{
    /**
     * Generate a readable but strong temporary password that satisfies the
     * change-password policy (mixed case + numbers).
     */
    public function generateTemporaryPassword(): string
    {
        return Str::upper(Str::random(1))
            . Str::lower(Str::random(5))
            . random_int(1000, 9999)
            . Str::random(2);
    }

    /**
     * Keep the legacy string `role` column aligned with the linked Role row so
     * existing policy checks (hasRole('super_admin', ...)) keep working.
     */
    public function syncRole(User $user, Role $role): void
    {
        $user->role_id = $role->id;
        $user->role = $role->slug;
    }

    /**
     * Replace a user's per-user permission GRANT overrides with the given set
     * of permission slugs. (Denies are not exposed in the UI yet.)
     */
    public function syncPermissionOverrides(User $user, array $permissionSlugs): void
    {
        $ids = Permission::whereIn('slug', $permissionSlugs)->pluck('id')->all();

        $sync = [];
        foreach ($ids as $id) {
            $sync[$id] = ['granted' => true];
        }

        $user->permissions()->sync($sync);
    }
}
