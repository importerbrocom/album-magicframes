<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restricts a route to admin users (role super_admin | admin). Staff accounts
 * get a 403. Used to gate staff-management endpoints so staff cannot create or
 * manage other accounts.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json(['message' => 'Admin access required.'], 403);
        }

        return $next($request);
    }
}
