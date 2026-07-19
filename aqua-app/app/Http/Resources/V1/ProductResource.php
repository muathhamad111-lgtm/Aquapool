<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The list shape: everything a catalogue card needs. Deliberately omits
 * `specifications` — a page showing every product would otherwise carry
 * every product's full spec tables. `ProductDetailResource` adds them.
 */
class ProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title_ar' => $this->title_ar,
            'title_en' => $this->title_en,
            'caption_ar' => $this->caption_ar,
            'caption_en' => $this->caption_en,
            'category' => $this->category,
            'category_id' => $this->category_id,
            // image_url is the cover; images is the full gallery with the
            // cover first. Both are sent: existing consumers read the
            // former, the detail page's gallery reads the latter.
            'image_url' => $this->image_url,
            'images' => $this->images ?? [],
            'price_label_ar' => $this->price_label_ar,
            'price_label_en' => $this->price_label_en,
            'sort_order' => $this->sort_order,
            'is_published' => $this->is_published,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
