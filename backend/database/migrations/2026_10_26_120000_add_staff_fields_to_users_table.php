<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extend the existing `users` table (reused for both admin + staff) with the
 * fields needed for Staff Management. We deliberately do NOT create a second
 * users/auth table — admins and staff are both rows here, distinguished by role.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Relative path on the "public" disk for the profile photo (nullable).
            $table->string('avatar_path')->nullable()->after('role');

            // Account lifecycle: active | inactive | suspended
            $table->string('status')->default('active')->after('avatar_path');

            // Force a password change on the staff member's first login.
            $table->boolean('must_change_password')->default(false)->after('status');

            // Who created/invited this account (admin user id). Null for the seed admin.
            $table->foreignId('invited_by')->nullable()->after('must_change_password')
                ->constrained('users')->nullOnDelete();

            $table->timestamp('last_login_at')->nullable()->after('invited_by');
            $table->timestamp('password_changed_at')->nullable()->after('last_login_at');

            $table->index('status');
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['role']);
            $table->dropConstrainedForeignId('invited_by');
            $table->dropColumn([
                'avatar_path',
                'status',
                'must_change_password',
                'last_login_at',
                'password_changed_at',
            ]);
        });
    }
};
