<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            // Decorative ambient motion shown on the public album:
            // none | auto | leaves | flowers | petals | snow | confetti |
            // sprinkles | balloons | bubbles | hearts. Nullable so existing
            // albums are unaffected (treated as 'auto' by the UI).
            $table->string('ambient_effect')->nullable()->after('theme');
        });
    }

    public function down(): void
    {
        Schema::table('albums', function (Blueprint $table) {
            $table->dropColumn('ambient_effect');
        });
    }
};
