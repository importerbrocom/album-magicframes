<?php

namespace Database\Seeders;

use App\Jobs\SyncAlbumFromGoogleDrive;
use App\Models\Album;
use App\Models\Role;
use App\Models\User;
use App\Services\AlbumService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Roles + permissions must exist before users can be linked to them.
        $this->call(RolePermissionSeeder::class);

        $superAdminRole = Role::where('slug', 'super_admin')->first();

        $admin = User::updateOrCreate(
            ['email' => 'admin@magicframes.test'],
            [
                'name' => 'Studio Admin',
                'role' => 'super_admin',
                'role_id' => $superAdminRole?->id,
                'status' => 'active',
                'must_change_password' => false,
                'password' => Hash::make('password'),
            ],
        );

        // Demo staff member (photographer) so Staff Management + staff login
        // are explorable immediately. Must change the temp password on first login.
        $photographerRole = Role::where('slug', 'photographer')->first();
        User::updateOrCreate(
            ['email' => 'staff@magicframes.test'],
            [
                'name' => 'Demo Photographer',
                'role' => 'photographer',
                'role_id' => $photographerRole?->id,
                'status' => 'active',
                'must_change_password' => true,
                'invited_by' => $admin->id,
                'password' => Hash::make('staffpass'),
            ],
        );

        // Demo album (uses demo Drive fixtures when DRIVE_DEMO_MODE=true).
        /** @var AlbumService $albumService */
        $albumService = app(AlbumService::class);

        $album = Album::updateOrCreate(
            ['slug' => 'rahul-anjali-demo01'],
            [
                'user_id' => $admin->id,
                'client_name' => 'Rahul & Anjali',
                'title' => 'Our Wedding Journey',
                'password_hash' => Hash::make('RA2026'),
                'google_drive_url' => 'https://drive.google.com/drive/folders/DEMO_FOLDER_ID',
                'google_drive_folder_id' => 'DEMO_FOLDER_ID',
                'drive_auth_mode' => $albumService->resolveAuthMode(),
                'description' => 'A collection of memories from our wedding celebrations.',
                'tagline' => 'Memories that last forever.',
                'theme' => 'classic',
                'status' => 'active',
                'allow_download' => true,
                'allow_share' => true,
                'sync_status' => 'pending',
            ],
        );

        // Run the sync inline during seeding so the demo album is viewable at once.
        SyncAlbumFromGoogleDrive::dispatchSync($album->id);
    }
}
