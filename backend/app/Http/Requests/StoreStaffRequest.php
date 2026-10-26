<?php

namespace App\Http\Requests;

use App\Support\Permissions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\User::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:190', Rule::unique('users', 'email')],
            // Admin may set a temporary password, or omit it to auto-generate one.
            'password' => ['nullable', 'string', Password::min(8)->letters()->numbers()],
            // super_admin can never be assigned via the staff UI.
            'role' => ['required', Rule::in(Permissions::assignableRoles())],
            'status' => ['sometimes', Rule::in(Permissions::allStatuses())],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => [Rule::in(Permissions::allPermissions())],
            'avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
        ];
    }
}
