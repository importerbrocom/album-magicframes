<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('albums', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('client_name');
            $table->string('title');
            // Unpredictable public identifier used in the shareable URL.
            $table->string('slug')->unique();
            $table->string('password_hash');
            $table->string('google_drive_folder_id')->nullable();
            $table->string('google_drive_url')->nullable();
            // Google Drive auth mode used for this album: api_key | oauth
            $table->string('drive_auth_mode')->default('api_key');
            $table->unsignedBigInteger('cover_photo_id')->nullable();
            $table->string('cover_image_url')->nullable();
            $table->text('description')->nullable();
            $table->string('tagline')->nullable();
            // active | disabled | draft
            $table->string('status')->default('active');
            $table->string('theme')->default('classic');
            $table->boolean('allow_download')->default(true);
            $table->boolean('allow_share')->default(true);
            // pending | syncing | completed | failed
            $table->string('sync_status')->default('pending');
            $table->unsignedInteger('sync_progress')->default(0);
            $table->string('sync_message')->nullable();
            $table->unsignedInteger('photo_count')->default(0);
            $table->unsignedInteger('event_count')->default(0);
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('sync_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('albums');
    }
};
