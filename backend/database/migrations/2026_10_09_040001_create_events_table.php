<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->string('google_drive_folder_id')->nullable();
            // Self-referencing: an event may be nested (rare) under another event.
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('cover_image_url')->nullable();
            $table->unsignedInteger('photo_count')->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->index(['album_id', 'parent_id']);
            $table->unique(['album_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
