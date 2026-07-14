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
        Schema::create('projects', function (Blueprint $table) {
            // UUID primary key, matching every other content module — real
            // data is seeded (not reset) via a read-only Supabase export, so
            // preserving the original IDs keeps that continuity.
            $table->uuid('id')->primary();
            $table->string('title_ar');
            $table->string('title_en');
            $table->string('location_ar')->nullable();
            $table->string('location_en')->nullable();
            // Legacy plain-text category, predates category_id. Preserved
            // as-is for data continuity — the public site never reads it,
            // it's only used as an admin-listing fallback string. Not a
            // cleanup target in this phase.
            $table->string('category')->default('residential');
            $table->string('image_url')->nullable();
            // Plain string, not an integer — matches the current admin
            // form's free-text year field and Supabase's own text column.
            $table->string('year')->nullable();
            $table->boolean('is_featured')->default(false);
            // Nullable and optional at every layer (unlike Products):
            // confirmed by the admin UI's CategoryCascader having no
            // `required` prop for Projects, and by every real exported row
            // currently having category_id = null.
            $table->foreignUuid('category_id')->nullable()->constrained('product_categories')->nullOnDelete();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_published')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
