<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Simple global key-value settings store (studio-wide config such as the
 * social media links shown on every album). Idempotent per project rule.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('settings')) {
            Schema::create('settings', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->text('value')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
