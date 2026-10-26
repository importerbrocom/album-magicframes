<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The authenticated user's own profile (admin or staff).
 */
class ProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'role_name' => $this->roleModel?->name,
            'avatar_url' => $this->avatarUrl(),
            'status' => $this->status,
            'must_change_password' => (bool) $this->must_change_password,
            'last_login_at' => $this->last_login_at,
            'password_changed_at' => $this->password_changed_at,
            'created_at' => $this->created_at,
            'permissions' => $this->effectivePermissions(),
        ];
    }
}
