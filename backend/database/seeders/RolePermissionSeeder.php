<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

/**
 * Seeds the built-in roles and the permission catalogue, and maps default
 * permissions to each role. Idempotent (updateOrCreate + sync).
 */
class RolePermissionSeeder extends Seeder
{
    /** The full permission catalogue, grouped for the UI. */
    public const PERMISSIONS = [
        'Albums' => [
            'albums.view' => 'View albums',
            'albums.create' => 'Create albums',
            'albums.update' => 'Edit albums',
            'albums.delete' => 'Delete albums',
            'albums.sync' => 'Sync albums from Google Drive',
        ],
        'Analytics' => [
            'analytics.view' => 'View analytics',
        ],
        'Staff' => [
            'staff.view' => 'View staff members',
            'staff.create' => 'Add staff members',
            'staff.update' => 'Edit staff members',
            'staff.delete' => 'Delete staff members',
            'staff.reset_password' => 'Reset staff passwords',
        ],
    ];

    /** Built-in roles: slug => [name, description, permission slugs]. */
    public const ROLES = [
        'super_admin' => [
            'name' => 'Super Admin',
            'description' => 'Full access to everything, including staff and roles.',
            'permissions' => '*', // implicitly all (handled in code too)
        ],
        'photographer' => [
            'name' => 'Photographer',
            'description' => 'Manages their own albums and views analytics.',
            'permissions' => [
                'albums.view', 'albums.create', 'albums.update', 'albums.delete',
                'albums.sync', 'analytics.view',
            ],
        ],
        'editor' => [
            'name' => 'Editor',
            'description' => 'Creates and edits albums but cannot delete them.',
            'permissions' => [
                'albums.view', 'albums.create', 'albums.update', 'albums.sync', 'analytics.view',
            ],
        ],
        'assistant' => [
            'name' => 'Assistant',
            'description' => 'Read-only access to albums and analytics.',
            'permissions' => ['albums.view', 'analytics.view'],
        ],
    ];

    public function run(): void
    {
        // Permissions
        $permBySlug = [];
        foreach (self::PERMISSIONS as $group => $perms) {
            foreach ($perms as $slug => $name) {
                $permBySlug[$slug] = Permission::updateOrCreate(
                    ['slug' => $slug],
                    ['name' => $name, 'group' => $group],
                );
            }
        }

        $allSlugs = array_keys($permBySlug);

        // Roles + their permission mappings
        foreach (self::ROLES as $slug => $def) {
            $role = Role::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => $def['name'],
                    'description' => $def['description'],
                    'is_system' => true,
                ],
            );

            $slugs = $def['permissions'] === '*' ? $allSlugs : $def['permissions'];
            $ids = collect($slugs)->map(fn ($s) => $permBySlug[$s]->id ?? null)->filter()->all();
            $role->permissions()->sync($ids);
        }
    }
}
