<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // Optional per-album Google review link. Falls back to a global
            // default (services.album.google_review_url) when empty.
            $table->string('google_review_url')->nullable()->after('allow_share');
            // Toggles for the new public engagement features.
            $table->boolean('allow_comments')->default(true)->after('google_review_url');
            $table->boolean('allow_enquiries')->default(true)->after('allow_comments');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn(['google_review_url', 'allow_comments', 'allow_enquiries']);
        });
    }
};
