<?php

use App\Http\Controllers\Admin\AlbumController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\StaffController;
use App\Http\Controllers\PublicAlbum\AlbumAccessController;
use App\Http\Controllers\PublicAlbum\AnalyticsController;
use App\Http\Controllers\PublicAlbum\CommentController;
use App\Http\Controllers\PublicAlbum\EnquiryController;
use App\Http\Controllers\PublicAlbum\FilmController;
use App\Http\Controllers\PublicAlbum\ImageController;
use App\Http\Controllers\PublicAlbum\PhotoController;
use App\Http\Controllers\PublicAlbum\QrController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin API (Sanctum protected)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->group(function () {
    // Public auth endpoint, rate limited to resist brute force.
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);

        // Self-service profile (admin + staff): edit own name/email + password.
        Route::match(['put', 'patch'], 'profile', [AuthController::class, 'updateProfile']);
        Route::post('profile/password', [AuthController::class, 'changePassword']);

        // Staff management — admin only.
        Route::middleware('admin.only')->group(function () {
            Route::get('staff', [StaffController::class, 'index']);
            Route::post('staff', [StaffController::class, 'store']);
            Route::get('staff/{staff}', [StaffController::class, 'show']);
            Route::match(['put', 'patch'], 'staff/{staff}', [StaffController::class, 'update']);
            Route::post('staff/{staff}/reset-password', [StaffController::class, 'resetPassword']);
            Route::delete('staff/{staff}', [StaffController::class, 'destroy']);
        });

        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('albums', [AlbumController::class, 'index']);
        Route::get('albums/categories', [AlbumController::class, 'categories']);
        Route::post('albums', [AlbumController::class, 'store']);
        Route::get('albums/{album}', [AlbumController::class, 'show']);
        Route::match(['put', 'patch'], 'albums/{album}', [AlbumController::class, 'update']);
        Route::delete('albums/{album}', [AlbumController::class, 'destroy']);
        Route::post('albums/{album}/sync', [AlbumController::class, 'sync']);
        Route::get('albums/{album}/sync-status', [AlbumController::class, 'syncStatus']);
        Route::get('albums/{album}/analytics', [AlbumController::class, 'analytics']);
        Route::get('albums/{album}/share', [AlbumController::class, 'share']);
        Route::get('albums/{album}/enquiries', [AlbumController::class, 'enquiries']);
        Route::get('albums/{album}/comments', [AlbumController::class, 'comments']);
        Route::get('albums/{album}/sections', [AlbumController::class, 'sections']);
        Route::match(['put', 'patch'], 'albums/{album}/sections/order', [AlbumController::class, 'updateSectionsOrder']);
        Route::match(['put', 'patch'], 'albums/{album}/sections/{event}', [AlbumController::class, 'updateSection']);
        Route::get('albums/{album}/gallery-videos', [AlbumController::class, 'galleryVideos']);
        Route::match(['put', 'patch'], 'albums/{album}/gallery-videos', [AlbumController::class, 'updateGalleryPosters']);
        Route::match(['put', 'patch'], 'albums/{album}/gallery-videos/order', [AlbumController::class, 'updateGalleryOrder']);
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

    // Authenticated image proxy (open so <img> tags load for shared links).
    // Serves private Drive thumbnails/previews through our own domain.
    Route::get('albums/{slug}/photos/{id}/thumb', [ImageController::class, 'thumb'])
        ->name('public.photos.thumb')->middleware('throttle:600,1');
    Route::get('albums/{slug}/photos/{id}/preview', [ImageController::class, 'preview'])
        ->name('public.photos.preview')->middleware('throttle:600,1');
    Route::get('albums/{slug}/photos/{id}/full', [ImageController::class, 'full'])
        ->name('public.photos.full')->middleware('throttle:600,1');

    // Wedding-film proxy for Drive-hosted videos (open, like the image proxy,
    // so the <video> element loads — including on the pre-auth cover screen).
    Route::get('albums/{slug}/film', [FilmController::class, 'stream'])
        ->name('public.albums.film')->middleware('throttle:300,1');
    Route::get('albums/{slug}/events/{event}/film', [FilmController::class, 'eventFilm'])
        ->name('public.events.film')->middleware('throttle:300,1');
    Route::get('albums/{slug}/events/{event}/cover', [ImageController::class, 'sectionCover'])
        ->name('public.events.cover')->middleware('throttle:600,1');
    // Separate "Video Gallery" (a Drive folder of videos). List + per-item stream.
    Route::get('albums/{slug}/video-gallery', [FilmController::class, 'videoGallery'])
        ->name('public.albums.videogallery')->middleware('throttle:120,1');
    Route::get('albums/{slug}/video-gallery/{fileId}', [FilmController::class, 'videoItem'])
        ->name('public.albums.videoitem')->middleware('throttle:300,1');
    Route::get('albums/{slug}/video-gallery/{fileId}/poster', [ImageController::class, 'videoPoster'])
        ->name('public.albums.videoposter')->middleware('throttle:600,1');

    // Engagement features — intentionally OPEN (no album token) so anyone with
    // the shared/reshared link (friends, family) can comment and enquire.
    // Rate limited + honeypot protected against spam.
    Route::get('albums/{slug}/comments', [CommentController::class, 'index'])->middleware('throttle:120,1');
    Route::post('albums/{slug}/comments', [CommentController::class, 'store'])->middleware('throttle:20,1');
    Route::post('albums/{slug}/enquiries', [EnquiryController::class, 'store'])->middleware('throttle:15,1');

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
