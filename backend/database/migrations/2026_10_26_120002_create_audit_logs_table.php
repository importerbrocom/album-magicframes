<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Immutable-ish audit trail for staff management + security actions. Modeled on
 * the analytics_events table (actor id + typed action + json meta). Records are
 * preserved even when the related user is deleted (nullOnDelete).
 *
 * If a partial/old `audit_logs` table already exists (e.g. from an interrupted
 * deploy), this migration ADDS any missing columns rather than skipping — so
 * the schema always ends up complete without dropping existing rows.
 */
return new class extends Migration {
    public function up(): void
    {
        if (! Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('actor_name')->nullable();
                $table->string('actor_email')->nullable();
                $table->string('action');
                $table->string('target_type')->nullable();
                $table->unsignedBigInteger('target_id')->nullable();
                $table->string('target_label')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->string('user_agent')->nullable();
                $table->json('meta')->nullable();
                $table->timestamps();

                $table->index(['action', 'created_at']);
                $table->index(['target_type', 'target_id']);
                $table->index('actor_id');
            });

            return;
        }

        // Table already exists — reconcile it by adding any missing columns.
        Schema::table('audit_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('audit_logs', 'actor_id')) {
                $table->unsignedBigInteger('actor_id')->nullable()->after('id');
            }
            if (! Schema::hasColumn('audit_logs', 'actor_name')) {
                $table->string('actor_name')->nullable()->after('actor_id');
            }
            if (! Schema::hasColumn('audit_logs', 'actor_email')) {
                $table->string('actor_email')->nullable()->after('actor_name');
            }
            if (! Schema::hasColumn('audit_logs', 'action')) {
                $table->string('action')->default('')->after('actor_email');
            }
            if (! Schema::hasColumn('audit_logs', 'target_type')) {
                $table->string('target_type')->nullable()->after('action');
            }
            if (! Schema::hasColumn('audit_logs', 'target_id')) {
                $table->unsignedBigInteger('target_id')->nullable()->after('target_type');
            }
            if (! Schema::hasColumn('audit_logs', 'target_label')) {
                $table->string('target_label')->nullable()->after('target_id');
            }
            if (! Schema::hasColumn('audit_logs', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('target_label');
            }
            if (! Schema::hasColumn('audit_logs', 'user_agent')) {
                $table->string('user_agent')->nullable()->after('ip_address');
            }
            if (! Schema::hasColumn('audit_logs', 'meta')) {
                $table->json('meta')->nullable()->after('user_agent');
            }
            if (! Schema::hasColumn('audit_logs', 'created_at')) {
                $table->timestamps();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
