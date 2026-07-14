<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

/**
 * Seeds the real rows exported (read-only) from the live Supabase
 * product_categories table — see
 * database/seeders/fixtures/product_categories_from_supabase.json.
 *
 * IDs are preserved exactly as exported (not regenerated) so the
 * still-Supabase-backed Products/Services/Projects tables, which store a
 * category_id pointing at these same UUIDs, keep resolving correctly.
 *
 * Rows are inserted in parent-before-child order regardless of their order
 * in the fixture, since parent_id has a real foreign key constraint here.
 *
 * Intentionally NOT run automatically on every deploy — run once manually
 * after the first migration, so a later redeploy can never clobber live
 * admin edits.
 */
class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $exported = json_decode(
            file_get_contents(__DIR__.'/fixtures/product_categories_from_supabase.json'),
            true,
        );

        $remaining = collect($exported)->keyBy('id');
        $inserted = [];

        while ($remaining->isNotEmpty()) {
            $ready = $remaining->filter(
                fn ($row) => $row['parent_id'] === null || isset($inserted[$row['parent_id']]),
            );

            if ($ready->isEmpty()) {
                // A parent_id in the export doesn't resolve to any row in
                // the export itself — bail loudly rather than silently
                // dropping rows.
                throw new \RuntimeException('Unresolvable parent_id in product_categories fixture: '.
                    $remaining->pluck('id')->implode(', '));
            }

            foreach ($ready as $row) {
                ProductCategory::updateOrCreate(['id' => $row['id']], [
                    'parent_id' => $row['parent_id'],
                    'name_ar' => $row['name_ar'],
                    'name_en' => $row['name_en'],
                    'kind' => $row['kind'],
                    'sort_order' => $row['sort_order'],
                    'is_published' => $row['is_published'],
                ]);
                $inserted[$row['id']] = true;
                $remaining->forget($row['id']);
            }
        }
    }
}
