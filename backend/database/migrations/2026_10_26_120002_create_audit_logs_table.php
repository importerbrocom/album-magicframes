<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Immutable-ish audit trail for staff management + security actions. Modeled on
 * the analytics_events table (actor id + typed action + json meta). Records are
 * preserved even when the related user is deleted (nullOnDelete), satisfying the
 * "preserve necessary audit records" requirement.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('audit_logs')) {
            return;
        }

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            // Who performed the action (admin/staff). Null if actor later deleted.
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name')->nullable();  // denormalized snapshot, survives deletion
            $table->string('actor_email')->nullable();

            // e.g. staff.created, staff.updated, staff.deleted, staff.status_changed,
            // staff.password_reset, auth.login, auth.logout, profile.updated, password.changed
            $table->string('action');

            // Optional target of the action (e.g. the staff user being changed).
            $table->string('target_type')->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->string('target_label')->nullable(); // snapshot, e.g. the target's email

            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['action', 'created_at']);
            $table->index(['target_type', 'target_id']);
            $table->index('actor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
