<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks inactive/suspended accounts from using their token, and forces a
 * first-login password change: while must_change_password is true the user can
 * only reach the change-password and auth endpoints. Everything else returns
 * 403 with a machine-readable code the SPA uses to redirect.
 */
class EnsureAccountActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if (! $user->isActive()) {
            // Revoke the token so a deactivated/suspended staffer is logged out.
            $user->currentAccessToken()?->delete();

            return response()->json([
                'message' => 'Your account is not active. Please contact an administrator.',
                'code' => 'account_inactive',
            ], 403);
        }

        if ($user->must_change_password && ! $this->isPasswordChangeRoute($request)) {
            return response()->json([
                'message' => 'You must change your temporary password before continuing.',
                'code' => 'password_change_required',
            ], 403);
        }

        return $next($request);
    }

    private function isPasswordChangeRoute(Request $request): bool
    {
        return $request->is('api/admin/profile/password')
            || $request->is('api/admin/me')
            || $request->is('api/admin/logout');
    }
}
