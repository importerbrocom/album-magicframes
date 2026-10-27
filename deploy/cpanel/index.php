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

// Bootstrap Laravel and handle the request...
(require_once $APP_BASE.'/bootstrap/app.php')
    ->handleRequest(Request::capture());
