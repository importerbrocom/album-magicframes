<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes — SPA host
|--------------------------------------------------------------------------
| This host runs LiteSpeed; .htaccess routes every non-file request to the
| Laravel front controller (index.php). Laravel serves the built React shell
| (index.html) for any route that isn't an API route, so client-side routes
| like /admin/albums work. API routes live in routes/api.php under /api.
*/

/** Serve the compiled SPA shell (index.html) from the public doc root. */
$serveSpa = function () {
    $index = public_path('index.html');

    abort_unless(is_file($index), 404, 'SPA shell not found.');

    return response(file_get_contents($index), 200)
        ->header('Content-Type', 'text/html; charset=UTF-8')
        ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
};

// Root.
Route::get('/', $serveSpa);

// Everything else that reaches Laravel and matched no API/web route above.
// Route::fallback runs for any unmatched path, which is exactly the SPA's
// deep client routes (/admin/*, /album/*, etc.). API 404s still return JSON
// because api.php routes are matched first under the /api prefix.
Route::fallback($serveSpa);
