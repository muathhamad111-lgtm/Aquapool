<?php

namespace App\Services;

use App\Models\ProductCategory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ProductCategoryService
{
    /**
     * All categories, every kind, published and unpublished — matches the
     * admin dashboard's existing behavior of fetching everything once and
     * slicing it client-side into tabs/tree/breadcrumb.
     *
     * @return Collection<int, ProductCategory>
     */
    public function all(): Collection
    {
        return ProductCategory::orderBy('sort_order')->get();
    }

    /**
     * @return Collection<int, ProductCategory>
     */
    public function publicList(string $kind): Collection
    {
        return ProductCategory::where('kind', $kind)
            ->where('is_published', true)
            ->orderBy('sort_order')
            ->get();
    }

    public function create(array $attributes): ProductCategory
    {
        $parentId = $attributes['parent_id'] ?? null;

        // A sub-category always inherits its parent's kind — the same rule
        // Supabase enforced with a BEFORE INSERT trigger, moved here since
        // this is business logic, not schema.
        $kind = $attributes['kind'] ?? 'product';
        if ($parentId) {
            $parent = ProductCategory::findOrFail($parentId);
            $kind = $parent->kind;
        }

        $siblingCount = ProductCategory::where('parent_id', $parentId)->count();

        return ProductCategory::create([
            'name_ar' => $attributes['name_ar'],
            'name_en' => $attributes['name_en'],
            'parent_id' => $parentId,
            'kind' => $kind,
            'sort_order' => $siblingCount + 1,
            'is_published' => true,
        ]);
    }

    public function update(ProductCategory $category, array $attributes): ProductCategory
    {
        $category->update([
            'name_ar' => $attributes['name_ar'],
            'name_en' => $attributes['name_en'],
        ]);

        return $category;
    }

    /**
     * Deletes the category and every descendant, one Eloquent delete() call
     * at a time — deliberately not a DB-level cascade — so each row fires
     * its own model event and gets its own audit log entry instead of
     * vanishing invisibly to Eloquent.
     */
    public function delete(ProductCategory $category): void
    {
        DB::transaction(function () use ($category) {
            foreach ($this->descendants($category) as $descendant) {
                $descendant->delete();
            }

            $category->delete();
        });
    }

    /**
     * @return \Illuminate\Support\Collection<int, ProductCategory> descendants
     *                                                              ordered so the deepest ones are deleted first (children before their
     *                                                              own parent).
     */
    private function descendants(ProductCategory $category): \Illuminate\Support\Collection
    {
        $all = collect();
        $queue = $category->children()->get();

        while ($queue->isNotEmpty()) {
            $next = $queue->shift();
            $all->push($next);
            $queue = $queue->merge($next->children()->get());
        }

        return $all->reverse()->values();
    }
}
