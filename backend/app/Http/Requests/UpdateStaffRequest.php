<?php

namespace App\Http\Requests;

use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The target user is resolved via route-model binding ({staff}).
        $target = $this->route('staff');

        return $this->user()?->can('update', $target) ?? false;
    }

    public function rules(): array
    {
        /** @var \App\Models\User|null $target */
        $target = $this->route('staff');
        $targetId = $target?->id;

        return [
            'name' => ['sometimes', 'string', 'max:150'],
            'email' => [
                'sometimes',
                'email',
                'max:190',
                Rule::unique('users', 'email')->ignore($targetId),
            ],
            'role' => ['sometimes', Rule::in(Permissions::assignableRoles())],
            'status' => ['sometimes', Rule::in(Permissions::allStatuses())],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => [Rule::in(Permissions::allPermissions())],
            'avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            'remove_avatar' => ['sometimes', 'boolean'],
        ];
    }
}
