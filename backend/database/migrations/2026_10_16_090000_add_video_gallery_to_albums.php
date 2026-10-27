<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // A SEPARATE Google Drive folder of videos (distinct from the photo
            // folder and the single teaser film). Its videos are listed as a
            // "Video Gallery" section on the public album. Nullable/optional.
            $table->string('video_gallery_url')->nullable()->after('film_url');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn('video_gallery_url');
        });
    }
};
