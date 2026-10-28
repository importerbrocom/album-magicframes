<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Social links are now studio-wide (stored in the settings table), not
 * per-album. Drop the per-album columns added earlier. Idempotent.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            foreach (['instagram_url', 'whatsapp_url', 'facebook_url', 'pinterest_url'] as $col) {
                if (Schema::hasColumn('albums', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            foreach (['instagram_url', 'whatsapp_url', 'facebook_url', 'pinterest_url'] as $col) {
                if (! Schema::hasColumn('albums', $col)) {
                    $table->string($col, 1000)->nullable();
                }
            }
        });
    }
};
