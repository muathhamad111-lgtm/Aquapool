<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Nullable + backfilled below, then made unique. A NOT NULL
            // unique column can't be added directly to a table that
            // already has rows.
            $table->string('slug')->nullable()->after('id');

            // Every image, in display order. images[0] is the cover and is
            // kept equal to the pre-existing image_url column by
            // ProductService — image_url stays because the catalogue list
            // endpoint, the seeded Supabase fixtures and the admin form all
            // read it today, and changing that is risk without benefit.
            $table->jsonb('images')->default('[]');

            // Free-form specification groups: a list of
            // {title_ar, title_en, fields: [{label_ar, label_en,
            // value_ar, value_en}]}. Free-form per product by design —
            // there is no shared definition table to keep in sync.
            $table->jsonb('specifications')->default('[]');
        });

        $this->backfill();

        Schema::table('products', function (Blueprint $table) {
            $table->string('slug')->nullable(false)->change();
            $table->unique('slug');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn(['slug', 'images', 'specifications']);
        });
    }

    /**
     * Gives every existing row a slug, and seeds `images` from the single
     * image_url each product already has, so no product starts out with an
     * empty gallery but a visible cover.
     */
    private function backfill(): void
    {
        $used = [];

        foreach (DB::table('products')->select('id', 'title_en', 'title_ar', 'image_url')->get() as $product) {
            // Str::slug() strips Arabic entirely (returns ''), so title_en
            // is the source and the id prefix is the fallback — never an
            // empty slug, which the unique index would reject on the second
            // untitled row.
            $base = Str::slug($product->title_en) ?: 'product-'.substr($product->id, 0, 8);

            $slug = $base;
            $suffix = 2;
            while (isset($used[$slug])) {
                $slug = $base.'-'.$suffix++;
            }
            $used[$slug] = true;

            DB::table('products')->where('id', $product->id)->update([
                'slug' => $slug,
                'images' => json_encode($product->image_url ? [$product->image_url] : []),
            ]);
        }
    }
};
