<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained()->cascadeOnDelete();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->string('google_drive_folder_id')->nullable();
            $table->string('name');
            $table->string('slug');
            // Self-referencing for nested folders inside an event.
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('cover_image_url')->nullable();
            $table->unsignedInteger('photo_count')->default(0);
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_available')->default(true);
            $table->timestamps();

            $table->index(['event_id', 'parent_id']);
            $table->unique(['event_id', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('folders');
    }
};
