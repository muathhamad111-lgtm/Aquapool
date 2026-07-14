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
        Schema::create('products', function (Blueprint $table) {
            // UUID primary key, matching product_categories/services — real
            // data is seeded (not reset) via a read-only Supabase export, so
            // preserving the original IDs keeps that continuity.
            $table->uuid('id')->primary();
            $table->string('title_ar');
            $table->string('title_en');
            $table->string('caption_ar')->nullable();
            $table->string('caption_en')->nullable();
            // Legacy plain-text category, predates category_id. Preserved
            // as-is for data continuity — the public site never reads it,
            // it's only used as an admin-listing fallback string. Not a
            // cleanup target in this phase.
            $table->string('category')->default('general');
            $table->string('image_url')->nullable();
            $table->string('price_label_ar')->nullable();
            $table->string('price_label_en')->nullable();
            // Nullable to match existing Supabase production semantics
            // exactly (a real exported row has category_id = null). The
            // admin UI's "required" behavior is enforced at the Form
            // Request layer only, not the database.
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
        Schema::dropIfExists('products');
    }
};
