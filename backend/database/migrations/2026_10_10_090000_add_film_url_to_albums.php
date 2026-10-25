<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // Optional wedding-film link (YouTube / Vimeo / direct MP4). When
            // set, the public album hero shows a play button that opens it.
            $table->string('film_url')->nullable()->after('cover_image_url');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn('film_url');
        });
    }
};
