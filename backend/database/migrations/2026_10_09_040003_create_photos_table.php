<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('folder_id')->nullable()->constrained()->cascadeOnDelete();
            // Unique identity of the underlying Drive file (prevents duplicates on re-sync).
            $table->string('google_drive_file_id')->index();
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('file_size')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            // Derived URLs (served/proxied via Laravel, never raw Drive credentials).
            $table->text('thumbnail_url')->nullable();
            $table->text('preview_url')->nullable();
            $table->text('original_url')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_favorite')->default(false);
            // Marked false when the Drive file disappears on re-sync.
            $table->boolean('is_available')->default(true);
            $table->timestamp('drive_created_at')->nullable();
            $table->timestamps();

            $table->unique(['album_id', 'google_drive_file_id']);
            $table->index(['event_id', 'sort_order']);
            $table->index(['folder_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
