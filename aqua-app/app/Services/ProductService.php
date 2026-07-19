<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Str;

class ProductService
{
    /**
     * @return Collection<int, Product>
     */
    public function all(): Collection
    {
        return Product::orderBy('sort_order')->get();
    }

    /**
     * @return Collection<int, Product>
     */
    public function publicList(): Collection
    {
        return Product::where('is_published', true)->orderBy('sort_order')->get();
    }

    /**
     * Backs the public product detail page. An unpublished product is a 404
     * here, not a 403 — a public visitor must not be able to tell an unpublished
     * product apart from one that never existed.
     *
     * @throws ModelNotFoundException
     */
    public function publicFindBySlug(string $slug): Product
    {
        return Product::where('slug', $slug)->where('is_published', true)->firstOrFail();
    }

    public function create(array $attributes): Product
    {
        return Product::create($this->prepare($attributes));
    }

    public function update(Product $product, array $attributes): Product
    {
        $product->update($this->prepare($attributes, $product));

        return $product;
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }

    /**
     * The two invariants every write must hold, enforced here rather than in
     * the controller or the admin UI so they can't be bypassed.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function prepare(array $attributes, ?Product $product = null): array
    {
        // 1. A product always has a unique slug, whether or not the client
        //    sent one.
        if (blank($attributes['slug'] ?? null)) {
            $title = $attributes['title_en'] ?? $product?->title_en ?? '';
            unset($attributes['slug']);

            if ($product === null || blank($product->slug)) {
                $attributes['slug'] = $this->uniqueSlug($title);
            }
        } else {
            $attributes['slug'] = $this->uniqueSlug($attributes['slug'], $product?->id);
        }

        // 2. image_url is the cover, and the cover is always images[0].
        //    Keeping them in sync here is what lets the catalogue list and
        //    the seeded Supabase data keep reading image_url unchanged
        //    while the detail page reads the full gallery.
        if (array_key_exists('images', $attributes)) {
            $images = array_values(array_filter((array) $attributes['images']));
            $attributes['images'] = $images;
            $attributes['image_url'] = $images[0] ?? null;
        }

        return $attributes;
    }

    /**
     * Str::slug() strips Arabic to an empty string, so title_en is the
     * source and a random suffix is the fallback — an empty slug would
     * collide on the unique index for the second untitled product.
     */
    private function uniqueSlug(string $source, ?string $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'product-'.Str::lower(Str::random(8));

        $slug = $base;
        $suffix = 2;

        while (Product::where('slug', $slug)->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))->exists()) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }
}
