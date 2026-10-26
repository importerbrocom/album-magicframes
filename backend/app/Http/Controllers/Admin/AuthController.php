<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminUserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Login for BOTH admins and staff (one users table, one auth flow). Issues a
 * Sanctum bearer token (stateless SPA / mobile, no cookies). Inactive or
 * suspended accounts are rejected. The returned user payload carries role,
 * permissions, status and the must_change_password flag so the SPA can route
 * staff to the forced first-login password change.
 */
class AuthController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Your account is not active. Please contact an administrator.'],
            ]);
        }

        $token = $user->createToken('admin-spa')->plainTextToken;

        $user->forceFill(['last_login_at' => now()])->save();
        $this->audit->log('auth.login', $user, $user, [], $request);

        return response()->json([
            'token' => $token,
            'user' => (new AdminUserResource($user))->resolve($request),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(
            (new AdminUserResource($request->user()))->resolve($request)
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->audit->log('auth.logout', $user, $user, [], $request);
        $user->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }
}
