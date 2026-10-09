<?php

/**
 * Magic Frames — cPanel doc-root front controller.
 *
 * Place this file as:
 *   /home/uddjzwrz/album.magicframes.nokkoo.in/index.php
 *
 * It is a copy of Laravel's public/index.php with the paths repointed at the
 * Laravel application living OUTSIDE the doc root. Adjust $APP_BASE if you
 * install the app somewhere other than ~/laravel/magicframes.
 */

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Absolute path to the Laravel app root (contains vendor/, bootstrap/, storage/).
$APP_BASE = '/home/uddjzwrz/laravel/magicframes';

// Maintenance mode...
if (file_exists($maintenance = $APP_BASE.'/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Composer autoloader...
require $APP_BASE.'/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
(require_once $APP_BASE.'/bootstrap/app.php')
    ->handleRequest(Request::capture());
