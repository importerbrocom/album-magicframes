<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin/staff user payload. NEVER exposes the password hash (hidden on the
 * model) — only safe profile + account fields.
 */
class AdminUserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'status' => $this->status,
            'permissions' => $this->permissions ?? [],
            'must_change_password' => (bool) $this->must_change_password,
            'avatar_url' => $this->avatarUrl(),
            'is_admin' => $this->isAdmin(),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
