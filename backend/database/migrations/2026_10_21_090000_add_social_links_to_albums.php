<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-album social media links. The admin enters these in the album form; the
 * public album shows matching social icons (Instagram, WhatsApp, Facebook,
 * Pinterest) in place of the old generic Share button.
 *
 * Idempotent (guarded with hasColumn) per the project's deployment rule.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            foreach (['instagram_url', 'whatsapp_url', 'facebook_url', 'pinterest_url'] as $col) {
                if (! Schema::hasColumn('albums', $col)) {
                    $table->string($col, 1000)->nullable();
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            foreach (['instagram_url', 'whatsapp_url', 'facebook_url', 'pinterest_url'] as $col) {
                if (Schema::hasColumn('albums', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
