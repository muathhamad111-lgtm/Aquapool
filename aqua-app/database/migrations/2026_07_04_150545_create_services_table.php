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
        Schema::create('services', function (Blueprint $table) {
            // UUID primary key, matching product_categories — real data is
            // seeded (not reset) via a read-only Supabase export, so
            // preserving the original IDs keeps that continuity even
            // though, unlike product_categories, no other table currently
            // references services.id as a foreign key.
            $table->uuid('id')->primary();
            $table->string('icon')->default('droplets');
            $table->string('title_ar');
            $table->string('title_en');
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            // Same FK behavior as Supabase: nulls out on category delete,
            // not a block or cascade. Fine inline here (unlike
            // product_categories' self-referencing FK) since this
            // references a different, already-existing table.
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
        Schema::dropIfExists('services');
    }
};
