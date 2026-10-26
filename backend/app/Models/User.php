<?php

namespace App\Models;

use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements CanResetPasswordContract
{
    use \Illuminate\Auth\Passwords\CanResetPassword;

    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'role',
        'role_id',
        'avatar_path',
        'status',
        'must_change_password',
        'invited_by',
        'last_login_at',
        'password_changed_at',
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
            'password_changed_at' => 'datetime',
            'must_change_password' => 'boolean',
            'password' => 'hashed',
        ];
    }

    // ---- Relationships ------------------------------------------------------

    public function albums(): HasMany
    {
        return $this->hasMany(Album::class);
    }

    public function roleModel(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /** Per-user permission overrides (grant/deny on top of the role). */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class)->withPivot('granted');
    }

    // ---- Role helpers (backward compatible) --------------------------------

    public function hasRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function isStaff(): bool
    {
        return ! $this->isAdmin();
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    // ---- Granular permissions ----------------------------------------------

    /**
     * Resolve the effective permission slugs for this user: the role's
     * permissions, plus explicit per-user grants, minus explicit per-user
     * denies. Super admins implicitly have every permission.
     */
    public function effectivePermissions(): array
    {
        if ($this->isAdmin()) {
            return Permission::query()->pluck('slug')->all();
        }

        $rolePerms = $this->roleModel
            ? $this->roleModel->permissions()->pluck('slug')->all()
            : [];

        $overrides = $this->permissions()->get();
        $granted = $overrides->where('pivot.granted', true)->pluck('slug')->all();
        $denied = $overrides->where('pivot.granted', false)->pluck('slug')->all();

        $effective = array_unique(array_merge($rolePerms, $granted));

        return array_values(array_diff($effective, $denied));
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }

        return in_array($permission, $this->effectivePermissions(), true);
    }

    // ---- Avatar -------------------------------------------------------------

    public function avatarUrl(): ?string
    {
        if (! $this->avatar_path) {
            return null;
        }

        return Storage::disk('public')->url($this->avatar_path);
    }

    // ---- Notifications ------------------------------------------------------

    /**
     * Send the password reset notification with a link to the React SPA.
     */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
