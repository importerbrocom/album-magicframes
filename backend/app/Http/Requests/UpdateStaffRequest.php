<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('staff');

        return $this->user()?->can('update', $target) ?? false;
    }

    public function rules(): array
    {
        $staff = $this->route('staff');
        $id = is_object($staff) ? $staff->id : $staff;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'email' => ['sometimes', 'required', 'email', 'max:191', Rule::unique('users', 'email')->ignore($id)],
            'role_id' => ['sometimes', 'required', 'integer', Rule::exists('roles', 'id')],
            'status' => ['sometimes', Rule::in(['active', 'inactive', 'suspended'])],
            'avatar' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'remove_avatar' => ['nullable', 'boolean'],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'slug')],
        ];
    }
}
