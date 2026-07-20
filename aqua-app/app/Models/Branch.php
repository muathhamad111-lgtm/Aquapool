<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Database\Factories\BranchFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    /** @use HasFactory<BranchFactory> */
    use Auditable, HasFactory, HasUuids;

    protected $fillable = [
        'name_ar',
        'name_en',
        'country_ar',
        'country_en',
        'region_ar',
        'region_en',
        'district_ar',
        'district_en',
        'street_ar',
        'street_en',
        'email',
        'phone',
        'hours_ar',
        'hours_en',
        'sort_order',
        'is_published',
    ];

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    /**
     * The audit log's label for a branch is its Arabic name — the site's
     * primary language, and what an admin reading the log recognises.
     */
    public function auditLabel(): ?string
    {
        return $this->name_ar;
    }
}
