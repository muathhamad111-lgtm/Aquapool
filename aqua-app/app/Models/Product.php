<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
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

    // Named productCategory(), not category(), because `category` is
    // already a real database column here (the legacy plain-text field) —
    // unlike Service, which has no such collision.
    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }
}
