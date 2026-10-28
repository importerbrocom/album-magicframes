<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes — SPA host
|--------------------------------------------------------------------------
| This host runs LiteSpeed with .htaccess rewrites effectively disabled for
| this domain (per-vhost AllowOverride restriction), so the usual
| "RewriteRule ^ index.html" SPA fallback never fires and deep client routes
| like /admin/albums 404. Instead we serve the React shell THROUGH Laravel's
| front controller (index.php), which IS reached for every request.
|
|  - /api/* is handled by routes/api.php (registered before this file wins for
|    api-prefixed paths).
|  - Any other path returns the built SPA index.html so React Router can take
|    over client-side routing.
*/

// Serve the SPA shell for the root and every non-API path (catch-all).
Route::get('/{any?}', function () {
    // The compiled SPA index.html lives in the public doc root beside index.php.
    $index = public_path('index.html');

    abort_unless(is_file($index), 404);

    return response(file_get_contents($index), 200)
        ->header('Content-Type', 'text/html; charset=UTF-8')
        // Never cache the shell so new deploys are picked up immediately.
        ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
})->where('any', '^(?!api/).*$');
