<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use App\Support\ProductSlugger;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use Auditable, HasFactory, HasUuids;

    protected $fillable = [
        'slug',
        'title_ar',
        'title_en',
        'caption_ar',
        'caption_en',
        'category',
        'image_url',
        'price_label_ar',
        'price_label_en',
        'category_id',
        'sort_order',
        'is_published',
        'images',
        'specifications',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
            'images' => 'array',
            // Named `specifications`, not `attributes`: a column called
            // `attributes` would shadow Eloquent's own $attributes property
            // inside the model and its traits.
            'specifications' => 'array',
        ];
    }

    /**
     * `slug` is NOT NULL, and ProductService is not the only writer —
     * seeders, factories and tinker create products directly. Filling it
     * here means a missing slug can never become a database error at a
     * call site that has no business knowing how slugs are built.
     */
    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (blank($product->slug)) {
                $product->slug = ProductSlugger::generate($product->title_en ?? '');
            }
        });

        // A product with a cover but an empty gallery would show its image
        // in the catalogue and nothing on the detail page. ProductService
        // handles the richer cases (replacing the cover, reordering,
        // clearing); this only covers the empty gallery a direct write
        // leaves behind. Deliberately does nothing when the gallery is
        // already populated, or when the cover was cleared on purpose.
        static::saving(function (Product $product) {
            if (blank($product->images) && filled($product->image_url)) {
                $product->images = [$product->image_url];
            }
        });
    }

    // Named productCategory(), not category(), because `category` is
    // already a real database column here (the legacy plain-text field) —
    // unlike Service, which has no such collision.
    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }
}
