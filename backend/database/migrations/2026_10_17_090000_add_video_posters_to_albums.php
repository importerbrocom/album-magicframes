<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // Per-video poster overrides for the Video Gallery, keyed by the
            // Drive file id: { "<driveFileId>": "<poster image url>" }.
            // Nullable JSON so existing albums are unaffected (auto first-frame).
            $table->json('video_posters')->nullable()->after('video_gallery_url');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn('video_posters');
        });
    }
};
