<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // Manual display order for the Video Gallery, as an array of Drive
            // file ids: ["<id1>","<id2>", …]. Videos not listed here fall to
            // the end in their Drive order. Nullable/backward-compatible.
            $table->json('video_order')->nullable()->after('video_posters');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn('video_order');
        });
    }
};
