<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Collection;

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

    public function create(array $attributes): Product
    {
        return Product::create($attributes);
    }

    public function update(Product $product, array $attributes): Product
    {
        $product->update($attributes);

        return $product;
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
