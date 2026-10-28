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
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('status')->default('active')->after('role');
            $table->boolean('must_change_password')->default(false)->after('status');
            $table->foreignId('created_by')->nullable()->after('must_change_password')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
            $table->dropColumn(['status', 'must_change_password']);
        });
    }
};
