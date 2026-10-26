<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks suspended/inactive accounts from using an otherwise-valid token, and
 * (for staff) forces a password change on first login before anything other
 * than the "me", "logout" and "change-password" endpoints can be reached.
 */
class EnsureAccountActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isActive()) {
            // Invalidate the token so a reactivated account must log in again.
            $user->currentAccessToken()?->delete();

            return response()->json([
                'message' => 'Your account is not active. Please contact an administrator.',
            ], 403);
        }

        if ($user && $user->must_change_password && ! $this->isAllowedWhileLocked($request)) {
            return response()->json([
                'message' => 'You must change your temporary password before continuing.',
                'must_change_password' => true,
            ], 423); // 423 Locked
        }

        return $next($request);
    }

    /**
     * Endpoints a staff member may still hit while their account is in the
     * "must change password" state.
     */
    private function isAllowedWhileLocked(Request $request): bool
    {
        return $request->is(
            'api/admin/me',
            'api/admin/logout',
            'api/admin/profile/password',
            'api/admin/profile',
        );
    }
}
