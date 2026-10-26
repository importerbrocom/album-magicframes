<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Authenticated user changes their OWN password. Requires the current password
 * (re-authentication) unless this is the forced first-login change, where no
 * current password check beyond the active session is required.
 */
class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            // On a forced first-login change we don't demand the temp password
            // again (the user is already authenticated with it); otherwise the
            // current password is required to re-authenticate.
            'current_password' => [
                $user && $user->must_change_password ? 'nullable' : 'required',
                'string',
            ],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers(),
            ],
        ];
    }
}
