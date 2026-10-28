<?php

/**
 * Magic Frames — cPanel doc-root front controller.
 *
 * Place this file as:
 *   /home/uddjzwrz/album-magicframes.nokkoo.in/index.php
 *
 * It is a copy of Laravel's public/index.php with the paths repointed at the
 * Laravel application living OUTSIDE the doc root. Adjust $APP_BASE if you
 * clone the repo somewhere other than ~/laravel/album-magicframes.
 *
 * Assumes the repo is cloned to ~/laravel/album-magicframes, so the Laravel
 * app (vendor/, bootstrap/, storage/) is in its "backend" subfolder.
 */

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Absolute path to the Laravel app root (contains vendor/, bootstrap/, storage/).
$APP_BASE = '/home/uddjzwrz/laravel/album-magicframes/backend';

// Maintenance mode...
if (file_exists($maintenance = $APP_BASE.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Composer autoloader...
require $APP_BASE.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request. We point Laravel's public path at
// THIS directory (the doc root) — not the app's own public/ — so the SPA shell
// served by the routes/web.php catch-all, public_path('index.html'), resolves
// to the built React index.html that sits here beside this front controller.
$app = require_once $APP_BASE.'/bootstrap/app.php';
$app->usePublicPath(__DIR__);
$app->handleRequest(Request::capture());
