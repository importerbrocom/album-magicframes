<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes — SPA host
|--------------------------------------------------------------------------
| .htaccess routes every non-file request to the Laravel front controller
| (index.php). Laravel serves the built React shell (index.html) for any route
| that isn't an API route, so client routes like /admin/albums work. API routes
| live in routes/api.php under /api and match first.
*/

/** Serve the compiled SPA shell (index.html) from the public doc root. */
$serveSpa = function () {
    // The doc-root index.php calls usePublicPath(__DIR__), so public_path()
    // should be the doc root. Fall back to a couple of known locations in case
    // the public path isn't rebound (e.g. a cached/old front controller), so a
    // deploy can never 404 the whole SPA.
    $candidates = [
        public_path('index.html'),
        $_SERVER['DOCUMENT_ROOT'].'/index.html',
        base_path('../album-magicframes.nokkoo.in/index.html'),
    ];

    foreach ($candidates as $path) {
        if ($path && is_file($path)) {
            return response(file_get_contents($path), 200)
                ->header('Content-Type', 'text/html; charset=UTF-8')
                ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
    }

    abort(404, 'SPA shell (index.html) not found.');
};

Route::get('/', $serveSpa);
Route::fallback($serveSpa);
