<?php

namespace App\Support;

use App\Models\Product;
use Illuminate\Support\Str;

/**
 * Shared slug generation for products, extracted rather than duplicated for
 * the same reason HtmlSanitizer was: it has two real callers — ProductService
 * (API writes) and the Product model's creating hook (seeders, factories,
 * tinker, anything writing Eloquent directly).
 */
class ProductSlugger
{
    /**
     * A unique, URL-safe slug derived from $source.
     *
     * Str::slug() strips Arabic to an empty string, so a product with no
     * Latin title falls back to a random suffix — an empty slug would
     * violate the unique index for the second such product.
     *
     * @param  string|null  $ignoreId  the product being updated, so its own
     *                                 slug isn't treated as a conflict
     */
    public static function generate(string $source, ?string $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'product-'.Str::lower(Str::random(8));

        $slug = $base;
        $suffix = 2;

        while (self::taken($slug, $ignoreId)) {
            $slug = $base.'-'.$suffix++;
        }

        return $slug;
    }

    private static function taken(string $slug, ?string $ignoreId): bool
    {
        return Product::where('slug', $slug)
            ->when($ignoreId, fn ($query) => $query->whereKeyNot($ignoreId))
            ->exists();
    }
}
