<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Granular RBAC: roles + permissions, with role→permission and (optional)
 * per-user permission overrides. The existing free-string `users.role` column
 * is kept and now mirrors a `roles.slug`, so legacy policy checks keep working
 * while we add fine-grained permissions on top.
 */
return new class extends Migration {
    public function up(): void
    {
        // Guarded with hasTable so the migration is safe to re-run after an
        // interrupted deploy (some tables may already exist).
        if (! Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('slug')->unique();   // super_admin | photographer | editor | assistant | ...
                $table->string('name');
                $table->string('description')->nullable();
                // Protect built-in roles from deletion/rename in the UI.
                $table->boolean('is_system')->default(false);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('permissions')) {
            Schema::create('permissions', function (Blueprint $table) {
                $table->id();
                $table->string('slug')->unique();   // e.g. albums.view, albums.create, staff.manage
                $table->string('name');
                $table->string('group')->nullable(); // UI grouping: Albums, Staff, Analytics, ...
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('permission_role')) {
            Schema::create('permission_role', function (Blueprint $table) {
                $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
                $table->foreignId('role_id')->constrained()->cascadeOnDelete();
                $table->primary(['permission_id', 'role_id']);
            });
        }

        // Per-user grant/deny overrides on top of the role's permissions.
        if (! Schema::hasTable('permission_user')) {
            Schema::create('permission_user', function (Blueprint $table) {
                $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                // true = explicitly granted, false = explicitly revoked (overrides role).
                $table->boolean('granted')->default(true);
                $table->primary(['permission_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_user');
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
