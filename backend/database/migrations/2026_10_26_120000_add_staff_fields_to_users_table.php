<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Extend the existing `users` table (reused for both admin + staff) with the
 * fields needed for Staff Management. We deliberately do NOT create a second
 * users/auth table — admins and staff are both rows here, distinguished by role.
 *
 * Each addition is guarded with an existence check so the migration is safe to
 * re-run on a partially-migrated database (e.g. after an interrupted deploy).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'avatar_path')) {
                // Relative path on the "public" disk for the profile photo.
                $table->string('avatar_path')->nullable()->after('role');
            }

            if (! Schema::hasColumn('users', 'status')) {
                // Account lifecycle: active | inactive | suspended
                $table->string('status')->default('active')->after('avatar_path');
            }

            if (! Schema::hasColumn('users', 'must_change_password')) {
                // Force a password change on the staff member's first login.
                $table->boolean('must_change_password')->default(false)->after('status');
            }

            if (! Schema::hasColumn('users', 'invited_by')) {
                // Who created/invited this account. Null for the seed admin.
                $table->foreignId('invited_by')->nullable()->after('must_change_password')
                    ->constrained('users')->nullOnDelete();
            }

            if (! Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('invited_by');
            }

            if (! Schema::hasColumn('users', 'password_changed_at')) {
                $table->timestamp('password_changed_at')->nullable()->after('last_login_at');
            }
        });

        // Indexes added separately and guarded, since column creation above may
        // have been skipped on a re-run.
        $this->addIndexIfMissing('users', 'users_status_index', 'status');
        $this->addIndexIfMissing('users', 'users_role_index', 'role');
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['users_status_index', 'users_role_index'] as $index) {
                try {
                    $table->dropIndex($index);
                } catch (\Throwable $e) {
                    // index may not exist — ignore
                }
            }

            if (Schema::hasColumn('users', 'invited_by')) {
                $table->dropConstrainedForeignId('invited_by');
            }

            foreach (['avatar_path', 'status', 'must_change_password', 'last_login_at', 'password_changed_at'] as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }

    private function addIndexIfMissing(string $table, string $indexName, string $column): void
    {
        $exists = collect(Schema::getIndexes($table))
            ->contains(fn ($i) => ($i['name'] ?? null) === $indexName);

        if (! $exists && Schema::hasColumn($table, $column)) {
            Schema::table($table, fn (Blueprint $t) => $t->index($column, $indexName));
        }
    }
};
