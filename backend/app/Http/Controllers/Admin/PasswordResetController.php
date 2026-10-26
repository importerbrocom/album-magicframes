<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

/**
 * Secure "Forgot password" flow for admins AND staff, using Laravel's native
 * password broker + the existing password_reset_tokens table. Tokens are
 * hashed and expire (config/auth.php passwords.users.expire, default 60 min).
 *
 * To avoid account enumeration, the request endpoint always returns the same
 * generic response regardless of whether the email exists.
 */
class PasswordResetController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    /** Step 1: email a reset link/token. */
    public function sendResetLink(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        // Always generic — never reveal whether the email is registered.
        return response()->json([
            'message' => 'If that email is registered, a password reset link has been sent.',
        ]);
    }

    /** Step 2: consume the token and set a new password. */
    public function reset(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->letters()->numbers()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) use ($request) {
                $user->forceFill([
                    'password' => $password, // hashed via cast
                    'remember_token' => Str::random(60),
                    'must_change_password' => false,
                ])->save();

                $user->tokens()->delete(); // revoke all API tokens

                $this->audit->log('password.reset', null, $user, [], $request);

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password has been reset. You can now sign in.']);
        }

        return response()->json([
            'message' => __($status),
        ], 422);
    }
}
