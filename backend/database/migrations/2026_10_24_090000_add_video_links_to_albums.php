<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Admin-added YouTube videos for the album's Video Gallery, each with its own
 * heading. Shape: [{ "title": "...", "youtube_url": "https://youtu.be/..." }].
 * Shown alongside (or instead of) the Google Drive folder videos.
 * Idempotent per the project's deployment rule.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            if (! Schema::hasColumn('albums', 'video_links')) {
                $table->json('video_links')->nullable()->after('video_order');
            }
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            if (Schema::hasColumn('albums', 'video_links')) {
                $table->dropColumn('video_links');
            }
        });
    }
};
