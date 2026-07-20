<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            // The exact map link for this branch, pasted from Google Maps.
            // Optional: when it's empty the directions button falls back to
            // a maps search built from the address, which is what every
            // existing branch already relies on.
            //
            // 2048 rather than the default 255: a Google Maps place URL
            // carries an encoded name and a coordinate blob and routinely
            // runs past 255 characters, which would truncate mid-URL.
            $table->string('map_url', 2048)->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn('map_url');
        });
    }
};
