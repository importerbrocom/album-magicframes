<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Audit trail for important staff-management and security actions
 * (logins, staff CRUD, status changes, password resets, role changes).
 * Records are preserved even when the acting/target user is deleted so the
 * trail survives (actor_id / target_id are nullOnDelete, with a text snapshot).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_label')->nullable(); // snapshot (name <email>) survives deletion
            $table->string('action');                   // e.g. staff.created, auth.login, password.reset
            $table->foreignId('target_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('target_label')->nullable();
            $table->json('meta')->nullable();           // extra context (changed fields, etc.)
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index(['action', 'created_at']);
            $table->index('target_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
