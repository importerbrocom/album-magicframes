<?php

namespace App\Support;

/**
 * Central catalog of roles and permissions.
 *
 * We keep RBAC lightweight and framework-native (a `role` string column plus a
 * per-user `permissions` JSON array on the users table) rather than pulling in
 * an external package. This mirrors the existing convention (User::hasRole()).
 *
 * Permissions are enforced SERVER-SIDE in UserPolicy and the EnsurePermission
 * middleware — the frontend only uses them to hide/disable UI, never to
 * authorize. A super_admin implicitly has every permission.
 */
final class Permissions
{
    // Roles ---------------------------------------------------------------
    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_ADMIN = 'admin';
    public const ROLE_PHOTOGRAPHER = 'photographer';
    public const ROLE_EDITOR = 'editor';
    public const ROLE_ASSISTANT = 'assistant';

    // Account statuses ----------------------------------------------------
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';
    public const STATUS_SUSPENDED = 'suspended';

    // Permission keys -----------------------------------------------------
    public const ALBUMS_VIEW = 'albums.view';
    public const ALBUMS_CREATE = 'albums.create';
    public const ALBUMS_UPDATE = 'albums.update';
    public const ALBUMS_DELETE = 'albums.delete';
    public const ANALYTICS_VIEW = 'analytics.view';
    public const GOOGLE_MANAGE = 'google.manage';
    public const STAFF_VIEW = 'staff.view';
    public const STAFF_MANAGE = 'staff.manage';

    /**
     * Roles that are considered administrators (full access to staff + settings).
     *
     * @return list<string>
     */
    public static function adminRoles(): array
    {
        return [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN];
    }

    /**
     * Roles that can be assigned to STAFF accounts (never super_admin via the UI).
     *
     * @return list<string>
     */
    public static function assignableRoles(): array
    {
        return [
            self::ROLE_ADMIN,
            self::ROLE_PHOTOGRAPHER,
            self::ROLE_EDITOR,
            self::ROLE_ASSISTANT,
        ];
    }

    /**
     * All valid role values (including super_admin).
     *
     * @return list<string>
     */
    public static function allRoles(): array
    {
        return array_merge([self::ROLE_SUPER_ADMIN], self::assignableRoles());
    }

    /**
     * @return list<string>
     */
    public static function allStatuses(): array
    {
        return [self::STATUS_ACTIVE, self::STATUS_INACTIVE, self::STATUS_SUSPENDED];
    }

    /**
     * Every permission key with a human label (for the UI picker).
     *
     * @return array<string, string>
     */
    public static function catalog(): array
    {
        return [
            self::ALBUMS_VIEW => 'View albums',
            self::ALBUMS_CREATE => 'Create albums',
            self::ALBUMS_UPDATE => 'Edit albums',
            self::ALBUMS_DELETE => 'Delete albums',
            self::ANALYTICS_VIEW => 'View analytics',
            self::GOOGLE_MANAGE => 'Manage Google Drive',
            self::STAFF_VIEW => 'View staff',
            self::STAFF_MANAGE => 'Manage staff',
        ];
    }

    /**
     * @return list<string>
     */
    public static function allPermissions(): array
    {
        return array_keys(self::catalog());
    }

    /**
     * Default permission set granted when a role is chosen but no explicit
     * permissions are provided.
     *
     * @return list<string>
     */
    public static function defaultsForRole(string $role): array
    {
        return match ($role) {
            self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN => self::allPermissions(),
            self::ROLE_PHOTOGRAPHER => [
                self::ALBUMS_VIEW,
                self::ALBUMS_CREATE,
                self::ALBUMS_UPDATE,
                self::ANALYTICS_VIEW,
                self::GOOGLE_MANAGE,
            ],
            self::ROLE_EDITOR => [
                self::ALBUMS_VIEW,
                self::ALBUMS_UPDATE,
                self::ANALYTICS_VIEW,
            ],
            self::ROLE_ASSISTANT => [
                self::ALBUMS_VIEW,
            ],
            default => [],
        };
    }
}
