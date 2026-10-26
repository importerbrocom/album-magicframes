<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Staff/user payload for the admin Staff Management screens. Never exposes the
 * password hash (hidden on the model) or raw credentials.
 */
class StaffResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'role_id' => $this->role_id,
            'role_name' => $this->roleModel?->name,
            'avatar_url' => $this->avatarUrl(),
            'status' => $this->status,
            'must_change_password' => (bool) $this->must_change_password,
            'invited_by' => $this->invited_by,
            'last_login_at' => $this->last_login_at,
            'password_changed_at' => $this->password_changed_at,
            'created_at' => $this->created_at,
            // Included on the single-staff view (where the permissions relation
            // is eager-loaded) or when explicitly requested.
            'permissions' => $this->when(
                $this->relationLoaded('permissions') || $request->boolean('with_permissions'),
                fn () => $this->effectivePermissions(),
            ),
        ];
    }
}
