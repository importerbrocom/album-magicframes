<?php

namespace App\Providers;

use App\Models\Album;
use App\Models\User;
use App\Policies\AlbumPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(Album::class, AlbumPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        // Generic permission gate: Gate::allows('permission', 'albums.create').
        // Super admins pass everything (handled in User::hasPermission()).
        Gate::define('permission', function (User $user, string $permission) {
            return $user->hasPermission($permission);
        });
    }
}
