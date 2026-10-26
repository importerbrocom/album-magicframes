<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Authenticated user updates their OWN name/email/avatar. Role, status and
 * permissions are intentionally NOT accepted here — a user can never escalate
 * their own privileges through the profile endpoint.
 */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:150'],
            'email' => [
                'sometimes',
                'email',
                'max:190',
                Rule::unique('users', 'email')->ignore($this->user()->id),
            ],
            // Profile photo: validated type + size (jpeg/png/webp, max 4 MB).
            'avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
            // Explicit remove-photo flag.
            'remove_avatar' => ['sometimes', 'boolean'],
        ];
    }
}
