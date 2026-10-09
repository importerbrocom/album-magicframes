<?php

use App\Http\Middleware\EnsureAlbumAccess;
use App\Services\GoogleDriveException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'album.access' => EnsureAlbumAccess::class,
        ]);

        // NOTE: We intentionally do NOT enable statefulApi(). Admin auth is
        // purely token-based (Sanctum personal access tokens sent as a Bearer
        // header), and public album access uses its own JWT. Enabling the
        // stateful (cookie + CSRF) guard caused "CSRF token mismatch" on login
        // when the SPA is served from the same origin as the API, because the
        // SPA never fetches a CSRF cookie. Keeping the API stateless avoids it.
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Return clean JSON for API errors; never leak raw PHP exceptions.
        $exceptions->render(function (GoogleDriveException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => $e->userMessage], $e->statusCode ?? 502);
            }
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Resource not found.'], 404);
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Resource not found.'], 404);
            }
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();
