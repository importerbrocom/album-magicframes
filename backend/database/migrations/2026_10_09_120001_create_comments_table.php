<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained()->cascadeOnDelete();
            $table->string('album_slug')->nullable();
            // Commenter's display name (shown next to their comment) + the text.
            $table->string('name');
            $table->text('body');
            // Moderation: visitors' comments are visible by default but can be
            // hidden by an admin. Flag kept for future spam control.
            $table->boolean('is_approved')->default(true);
            $table->string('visitor_hash')->nullable();
            $table->timestamps();

            $table->index(['album_id', 'is_approved', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
