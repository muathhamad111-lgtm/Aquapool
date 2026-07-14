<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use Auditable, HasFactory, HasUuids;

    protected $fillable = [
        'title_ar',
        'title_en',
        'location_ar',
        'location_en',
        'category',
        'image_url',
        'year',
        'is_featured',
        'category_id',
        'sort_order',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'is_featured' => 'boolean',
            'is_published' => 'boolean',
        ];
    }

    // Named productCategory(), not category(), because `category` is
    // already a real database column here (the legacy plain-text field) —
    // same reasoning as Product.
    public function productCategory(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }
}
