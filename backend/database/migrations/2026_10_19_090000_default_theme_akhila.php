<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Single fixed theme: make 'akhila' the default and apply it to every
        // existing album (the theme picker has been removed from the admin UI).
        Schema::table('albums', function ($table) {
            $table->string('theme')->default('akhila')->change();
        });
        DB::table('albums')->update(['theme' => 'akhila']);
    }

    public function down(): void
    {
        Schema::table('albums', function ($table) {
            $table->string('theme')->default('classic')->change();
        });
    }
};
