<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use App\Support\Permissions;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'avatar_path',
        'role',
        'status',
        'permissions',
        'must_change_password',
        'last_login_at',
        'created_by',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'permissions' => 'array',
            'must_change_password' => 'boolean',
        ];
    }

    public function albums(): HasMany
    {
        return $this->hasMany(Album::class);
    }

    /** Send the SPA-aware password reset notification. */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /** Staff accounts this user created (admin → staff). */
    public function createdStaff(): HasMany
    {
        return $this->hasMany(User::class, 'created_by');
    }

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    /** Is this an administrator (full staff + settings access)? */
    public function isAdmin(): bool
    {
        return $this->hasRole(...Permissions::adminRoles());
    }

    public function isSuperAdmin(): bool
    {
        return $this->hasRole(Permissions::ROLE_SUPER_ADMIN);
    }

    /**
     * Permission check. Admins implicitly have every permission; everyone else
     * is checked against their stored permissions array.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return in_array($permission, $this->permissions ?? [], true);
    }

    /** Account is usable for login (active and not suspended/inactive). */
    public function isActive(): bool
    {
        return $this->status === Permissions::STATUS_ACTIVE;
    }

    /** Absolute URL to the profile photo, or null. */
    public function avatarUrl(): ?string
    {
        if (! $this->avatar_path) {
            return null;
        }

        return Storage::disk('public')->url($this->avatar_path);
    }
}
