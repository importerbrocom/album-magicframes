<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Google Drive file id of a video found in this section's folder
            // (auto-detected during sync). When set, the section card shows a
            // play button that streams the clip. Nullable/backward-compatible.
            $table->string('film_drive_id')->nullable()->after('google_drive_folder_id');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('film_drive_id');
        });
    }
};
