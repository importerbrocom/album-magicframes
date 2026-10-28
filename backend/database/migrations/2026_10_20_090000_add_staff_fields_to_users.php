<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Staff accounts: an admin can create additional logins (role = "staff").
 *
 *  - status               active | suspended — a suspended user cannot log in.
 *  - must_change_password forces a password change on next login (set when the
 *                         admin creates the account or resets the password).
 *  - created_by           the admin user id that created this staff account
 *                         (kept nullable + nullOnDelete so audit survives).
 *
 * Idempotent: guarded with hasColumn so it is safe to re-run even if some of
 * these columns already exist on the users table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'status')) {
                $table->string('status')->default('active')->after('role');
            }
            if (! Schema::hasColumn('users', 'must_change_password')) {
                $table->boolean('must_change_password')->default(false)->after('status');
            }
            if (! Schema::hasColumn('users', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('must_change_password')
                    ->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
            if (Schema::hasColumn('users', 'must_change_password')) {
                $table->dropColumn('must_change_password');
            }
            if (Schema::hasColumn('users', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};
