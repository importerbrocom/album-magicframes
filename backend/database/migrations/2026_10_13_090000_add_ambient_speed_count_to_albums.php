<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // Tuning for the ambient motion effect.
            //  - ambient_speed: slow | normal | fast  (null => normal)
            //  - ambient_count: number of particles 0–60 (null => effect default)
            $table->string('ambient_speed')->nullable()->after('ambient_effect');
            $table->unsignedSmallInteger('ambient_count')->nullable()->after('ambient_speed');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn(['ambient_speed', 'ambient_count']);
        });
    }
};
