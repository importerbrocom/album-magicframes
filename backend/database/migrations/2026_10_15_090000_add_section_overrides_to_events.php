<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Manual admin overrides for a section card. When set they win over
            // the auto-detected cover photo / folder video. Nullable so the
            // automatic behaviour is unchanged when left blank.
            $table->string('cover_override')->nullable()->after('cover_image_url');
            $table->string('film_url_override')->nullable()->after('film_drive_id');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['cover_override', 'film_url_override']);
        });
    }
};
