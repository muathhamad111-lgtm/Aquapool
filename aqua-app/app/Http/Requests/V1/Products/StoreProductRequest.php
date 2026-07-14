<?php

namespace App\Http\Requests\V1\Products;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title_ar' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'caption_ar' => ['nullable', 'string', 'max:500'],
            'caption_en' => ['nullable', 'string', 'max:500'],
            // Legacy plain-text field, predates category_id. Kept lenient
            // and optional — not meaningfully validated further, since the
            // public site never reads it and it's not a cleanup target in
            // this phase.
            'category' => ['nullable', 'string', 'max:255'],
            // Not a `url` rule: the current admin form falls back to a
            // relative placeholder path (/site/placeholder.jpg) when no
            // image is uploaded, and that literal value is saved as-is.
            'image_url' => ['nullable', 'string', 'max:2048'],
            'price_label_ar' => ['nullable', 'string', 'max:255'],
            'price_label_en' => ['nullable', 'string', 'max:255'],
            // Required here, unlike Service's category_id — the current
            // admin UI enforces category selection via a native
            // `<select required>` (CategoryCascader with required=true).
            // The database column itself stays nullable to match existing
            // Supabase production data (a real exported row has
            // category_id = null) — this is a request-layer rule only.
            'category_id' => ['required', 'uuid', 'exists:product_categories,id'],
            'sort_order' => ['nullable', 'integer'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
