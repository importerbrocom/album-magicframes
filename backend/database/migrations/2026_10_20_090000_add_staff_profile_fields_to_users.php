<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extend the existing users table to support admin profile management and
 * staff accounts. We deliberately REUSE the users table (no duplicate user
 * or auth tables) — staff are users with a non-admin role.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Profile photo stored on the "public" disk; path is relative.
            $table->string('avatar_path')->nullable()->after('email');

            // Account lifecycle: active | inactive | suspended.
            $table->string('status')->default('active')->after('role');

            // Granular per-user permissions (JSON array of permission keys).
            // Enforced server-side in UserPolicy / EnsurePermission middleware.
            $table->json('permissions')->nullable()->after('status');

            // Force a password change on first login for freshly created staff.
            $table->boolean('must_change_password')->default(false)->after('permissions');

            // Audit/analytics helpers.
            $table->timestamp('last_login_at')->nullable()->after('must_change_password');
            $table->foreignId('created_by')->nullable()->after('last_login_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn([
                'avatar_path',
                'status',
                'permissions',
                'must_change_password',
                'last_login_at',
            ]);
        });
    }
};
