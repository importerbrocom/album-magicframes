<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProfileResource;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private AuditService $audit)
    {
    }

    /**
     * Admin / staff login. Issues a Sanctum bearer token. The same endpoint
     * serves both roles — the returned user payload tells the SPA which
     * dashboard to show and whether a first-login password change is required.
     */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            // Record failed attempts (without leaking which part was wrong).
            $this->audit->log(null, 'auth.login_failed', null, ['email' => $data['email']]);

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->isActive()) {
            $this->audit->log($user, 'auth.login_blocked', $user, ['status' => $user->status]);

            throw ValidationException::withMessages([
                'email' => ['Your account is not active. Please contact an administrator.'],
            ]);
        }

        $token = $user->createToken('admin-spa')->plainTextToken;

        $user->forceFill(['last_login_at' => now()])->save();
        $this->audit->log($user, 'auth.login', $user);

        return response()->json([
            'token' => $token,
            'user' => (new ProfileResource($user))->resolve(),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return (new ProfileResource($request->user()))->response();
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->currentAccessToken()?->delete();
        $this->audit->log($user, 'auth.logout', $user);

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * Forgot password: email a secure, expiring reset token. Always responds
     * with a generic message so attackers can't enumerate accounts.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        $this->audit->log(null, 'password.reset_requested', null, [
            'email' => $request->input('email'),
        ]);

        return response()->json([
            'message' => 'If an account exists for that email, a reset link has been sent.',
        ]);
    }

    /**
     * Reset password using the emailed token. Tokens expire per
     * config/auth.php (passwords.users.expire, default 60 minutes).
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)->mixedCase()->numbers()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                    'must_change_password' => false,
                    'password_changed_at' => now(),
                ])->save();

                // Invalidate any existing API tokens after a reset.
                $user->tokens()->delete();

                $this->audit->log($user, 'password.reset', $user);
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['message' => 'Your password has been reset. Please log in.']);
    }
}
