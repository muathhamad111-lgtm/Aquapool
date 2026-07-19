<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            // UUID primary key (not the Laravel-default auto-increment id) —
            // deliberately preserves ID compatibility with the still-
            // Supabase-backed Products/Projects/Services during the
            // transition, and with whatever those rows already store in
            // their category_id column.
            $table->uuid('id')->primary();
            // No cascadeOnDelete(): descendants are deleted explicitly by
            // ProductCategoryService so each one fires its own Eloquent
            // 'deleted' event and gets its own audit log entry. A DB-level
            // cascade would delete them invisibly to Eloquent.
            $table->uuid('parent_id')->nullable();
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('kind')->default('product');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();

            $table->index('kind');
        });

        // Self-referencing FK added in a separate statement — Postgres
        // rejects it if it's part of the same CREATE TABLE as the primary
        // key it references.
        Schema::table('product_categories', function (Blueprint $table) {
            $table->foreign('parent_id')->references('id')->on('product_categories');
        });

        // Same-row constraint the Supabase migration also had — this is a
        // simple CHECK, not the cross-row kind-inheritance rule (that one
        // lives in ProductCategoryService, since a DB CHECK can't compare
        // against a different row).
        //
        // PostgreSQL only — sqlite (the test suite) has no ALTER TABLE ADD
        // CONSTRAINT. See the same guard in the users migration.
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE product_categories ADD CONSTRAINT product_categories_kind_check CHECK (kind IN ('product', 'service', 'project'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};
