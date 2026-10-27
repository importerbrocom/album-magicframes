<?php

/**
 * Magic Frames — cPanel doc-root front controller.
 *
 * Place this file as:
 *   /home/uddjzwrz/album2.nokkoo.in/index.php
 *
 * It is a copy of Laravel's public/index.php with the paths repointed at the
 * Laravel application living OUTSIDE the doc root. Adjust $APP_BASE if you
 * clone/upload the Laravel app somewhere other than ~/laravel/album2.
 *
 * The deploy uploads the Laravel app directly into ~/laravel/album2, so
 * artisan/vendor/bootstrap/storage live at that path (no backend/ subfolder).
 */

use Illuminate\Http\Request;

/*
 * SPA shim: on LiteSpeed/cPanel the server resolves the directory index to this
 * index.php for the site root ("/"), which would serve Laravel's welcome page
 * instead of the React build. Serve the SPA shell (index.html) directly for the
 * homepage BEFORE Laravel boots. API (/api/*) and health (/up) are untouched —
 * they have their own paths and fall through to Laravel below.
 */
$__spaUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
if (($__spaUri === '/' || $__spaUri === '/index.php') && is_file(__DIR__.'/index.html')) {
    header('Content-Type: text/html; charset=UTF-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    readfile(__DIR__.'/index.html');
    exit;
}

define('LARAVEL_START', microtime(true));

// Absolute path to the Laravel app root (contains vendor/, bootstrap/, storage/).
// The deploy workflow uploads the Laravel app directly into this folder, so
// artisan/vendor/bootstrap live here (NOT in a backend/ subfolder).
$APP_BASE = '/home/uddjzwrz/laravel/album2';

// Maintenance mode...
if (file_exists($maintenance = $APP_BASE.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Composer autoloader...
require $APP_BASE.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once $APP_BASE.'/bootstrap/app.php')
    ->handleRequest(Request::capture());
