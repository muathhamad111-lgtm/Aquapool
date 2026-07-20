<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BranchResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'country_ar' => $this->country_ar,
            'country_en' => $this->country_en,
            'region_ar' => $this->region_ar,
            'region_en' => $this->region_en,
            'district_ar' => $this->district_ar,
            'district_en' => $this->district_en,
            'street_ar' => $this->street_ar,
            'street_en' => $this->street_en,
            'email' => $this->email,
            'phone' => $this->phone,
            'map_url' => $this->map_url,
            'hours_ar' => $this->hours_ar,
            'hours_en' => $this->hours_en,
            'sort_order' => $this->sort_order,
            'is_published' => $this->is_published,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
