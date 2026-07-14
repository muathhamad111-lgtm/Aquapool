<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            // UUID primary key, matching every other content module — real
            // data (if any exists by deploy time) is seeded via a read-only
            // Supabase export, so preserving the original IDs keeps that
            // continuity.
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('city')->nullable();
            $table->string('project_type')->nullable();
            $table->string('budget')->nullable();
            $table->string('timeline')->nullable();
            $table->string('subject')->nullable();
            $table->text('message');
            $table->string('status')->default('new');
            // Matches the original Supabase schema exactly: created_at only,
            // no updated_at. See Message::UPDATED_AT = null.
            $table->timestamp('created_at')->useCurrent();

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
