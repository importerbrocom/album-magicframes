<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores an APP_KEY-encrypted copy of the album password so admins can view
 * it again in Edit Album. The hash in password_hash is still what verifies
 * visitors. Albums created before this have no copy until the password is set.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->text('password_encrypted')->nullable()->after('password_hash');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn('password_encrypted');
        });
    }
};
