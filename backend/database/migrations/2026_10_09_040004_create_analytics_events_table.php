<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('analytics_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('album_id')->constrained()->cascadeOnDelete();
            // album_view | event_view | photo_view | download | share
            $table->string('type');
            $table->unsignedBigInteger('event_id')->nullable();
            $table->unsignedBigInteger('photo_id')->nullable();
            // Hashed visitor fingerprint for unique-visitor counting (no raw IP stored).
            $table->string('visitor_hash')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['album_id', 'type']);
            $table->index(['album_id', 'visitor_hash']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_events');
    }
};
