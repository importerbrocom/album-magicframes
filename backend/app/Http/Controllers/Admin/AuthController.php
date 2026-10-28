<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login for both admin and staff (one shared login). Issues a Sanctum
     * bearer token. Suspended accounts are rejected. The response includes
     * `must_change_password` so the SPA can force a password change on first
     * login before granting access to the dashboard.
     */
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
                'email' => ['This account has been suspended. Please contact your administrator.'],
            ]);
        }

        $token = $user->createToken('admin-spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->toAuthArray(),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->toAuthArray());
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /**
     * Update the authenticated user's own profile (name + email). Any logged-in
     * user (admin or staff) may edit their own details.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
        ]);

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated.',
            'user' => $user->fresh()->toAuthArray(),
        ]);
    }

    /**
     * Change the authenticated user's own password. Requires the current
     * password. Clears the must_change_password flag (used for first login).
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $data['password'],
            'must_change_password' => false,
        ]);

        // Invalidate other sessions/tokens for safety; keep the current one.
        $currentId = $user->currentAccessToken()?->id;
        $user->tokens()->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))->delete();

        return response()->json([
            'message' => 'Password changed.',
            'user' => $user->fresh()->toAuthArray(),
        ]);
    }

    /**
     * Upload/replace the authenticated user's profile photo. Stored on the
     * public disk (served via the /storage symlink). Replaces any existing one.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:4096'],
        ]);

        $user = $request->user();

        // Remove the previous avatar file if present.
        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        // Store under avatars/ with a unique name; keep the original extension.
        $path = $request->file('avatar')->store('avatars', 'public');

        $user->update(['avatar_path' => $path]);

        return response()->json([
            'message' => 'Profile photo updated.',
            'user' => $user->fresh()->toAuthArray(),
        ]);
    }

    /** Remove the authenticated user's profile photo. */
    public function removeAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->update(['avatar_path' => null]);
        }

        return response()->json([
            'message' => 'Profile photo removed.',
            'user' => $user->fresh()->toAuthArray(),
        ]);
    }
}
