<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // Album type (Wedding, Birthday, Engagement, Maternity, …). Drives
            // the dynamic hero eyebrow and keeps the viewer event-agnostic.
            // Nullable + no default so existing albums are unaffected.
            $table->string('category')->nullable()->after('title');
            // Optional event date shown in the hero when present.
            $table->date('event_date')->nullable()->after('category');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn(['category', 'event_date']);
        });
    }
};
