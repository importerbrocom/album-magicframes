<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('enquiries', function (Blueprint $table) {
            $table->id();
            // Enquiries belong to the album they were submitted from (nullable so
            // a general enquiry is never lost even if the album is later removed).
            $table->foreignId('album_id')->nullable()->constrained()->nullOnDelete();
            $table->string('album_slug')->nullable();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->text('message')->nullable();
            // Forwarding status to the CRN system: pending | sent | failed
            $table->string('crn_status')->default('pending');
            $table->text('crn_response')->nullable();
            $table->string('visitor_hash')->nullable();
            $table->timestamps();

            $table->index(['album_id', 'created_at']);
            $table->index('crn_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enquiries');
    }
};
