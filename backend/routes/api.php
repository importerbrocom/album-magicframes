<?php

use App\Http\Controllers\Admin\AlbumController;
use App\Http\Controllers\Admin\AuditLogController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ProfileController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\PublicAlbum\AlbumAccessController;
use App\Http\Controllers\PublicAlbum\AnalyticsController;
use App\Http\Controllers\PublicAlbum\PhotoController;
use App\Http\Controllers\PublicAlbum\QrController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

// {staff} route parameter resolves to a User model.
Route::model('staff', User::class);

/*
|--------------------------------------------------------------------------
| Admin API (Sanctum protected)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {
    // Public auth endpoints, rate limited to resist brute force / abuse.
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');

    Route::middleware('auth:sanctum')->group(function () {
        // Always reachable (even while account is locked for a password change).
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);

        // Self-service profile (admin AND staff). The account.active middleware
        // still allows the password-change endpoints while "must_change_password".
        Route::middleware('account.active')->group(function () {
            Route::get('profile', [ProfileController::class, 'show']);
            Route::match(['put', 'patch'], 'profile', [ProfileController::class, 'update']);
            Route::post('profile/avatar', [ProfileController::class, 'updateAvatar']);
            Route::delete('profile/avatar', [ProfileController::class, 'removeAvatar']);
            Route::post('profile/password', [ProfileController::class, 'changePassword']);
        });

        // Everything below requires an active, unlocked account.
        Route::middleware('account.active')->group(function () {
            Route::get('dashboard', [DashboardController::class, 'index']);

            // Albums (existing). viewAny/create/etc. still enforced by AlbumPolicy.
            Route::get('albums', [AlbumController::class, 'index']);
            Route::post('albums', [AlbumController::class, 'store']);
            Route::get('albums/{album}', [AlbumController::class, 'show']);
            Route::match(['put', 'patch'], 'albums/{album}', [AlbumController::class, 'update']);
            Route::delete('albums/{album}', [AlbumController::class, 'destroy']);
            Route::post('albums/{album}/sync', [AlbumController::class, 'sync']);
            Route::get('albums/{album}/sync-status', [AlbumController::class, 'syncStatus']);
            Route::get('albums/{album}/analytics', [AlbumController::class, 'analytics']);
            Route::get('albums/{album}/share', [AlbumController::class, 'share']);

            // --- Staff Management (admin / staff.* permission; enforced by policy) ---
            Route::get('staff', [StaffController::class, 'index']);
            Route::post('staff', [StaffController::class, 'store']);
            Route::get('staff/{staff}', [StaffController::class, 'show']);
            Route::match(['put', 'patch'], 'staff/{staff}', [StaffController::class, 'update']);
            Route::patch('staff/{staff}/status', [StaffController::class, 'updateStatus']);
            Route::post('staff/{staff}/reset-password', [StaffController::class, 'resetPassword']);
            Route::delete('staff/{staff}', [StaffController::class, 'destroy']);

            // --- Roles & permissions (admin only) ---
            Route::middleware('role:super_admin')->group(function () {
                Route::get('roles', [RoleController::class, 'index']);
                Route::get('permissions', [RoleController::class, 'permissions']);
                Route::post('roles', [RoleController::class, 'store']);
                Route::match(['put', 'patch'], 'roles/{role}', [RoleController::class, 'update']);
                Route::delete('roles/{role}', [RoleController::class, 'destroy']);

                // --- Audit / staff activity logs (admin only) ---
                Route::get('audit-logs', [AuditLogController::class, 'index']);
            });
        });
    });
});

/*
|--------------------------------------------------------------------------
| Public Album API
|--------------------------------------------------------------------------
| Landing + verify are open (rate limited). Everything else requires an
| album-scoped access token enforced by the EnsureAlbumAccess middleware.
*/
Route::prefix('public')->group(function () {
    Route::get('albums/{slug}/landing', [AlbumAccessController::class, 'landing'])
        ->middleware('throttle:60,1');

    Route::post('albums/{slug}/verify', [AlbumAccessController::class, 'verify'])
        ->middleware('throttle:20,1');

    // QR code image (public; encodes the already-public share URL).
    Route::get('albums/{slug}/qr', [QrController::class, 'show'])->middleware('throttle:60,1');

    // Token-protected content.
    Route::middleware('album.access')->group(function () {
        Route::get('albums/{slug}', [AlbumAccessController::class, 'show']);
        Route::get('albums/{slug}/events', [AlbumAccessController::class, 'events']);
        Route::get('albums/{slug}/events/{event}', [AlbumAccessController::class, 'event']);
        Route::get('albums/{slug}/photos', [PhotoController::class, 'index']);
        Route::get('albums/{slug}/photos/{id}', [PhotoController::class, 'show']);
        Route::get('albums/{slug}/photos/{id}/download', [PhotoController::class, 'download'])
            ->name('public.photos.download');
        Route::post('albums/{slug}/analytics', [AnalyticsController::class, 'store']);
    });
});
