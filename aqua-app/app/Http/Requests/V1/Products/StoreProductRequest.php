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

            // Optional: the service generates one from title_en when it's
            // absent, and de-duplicates whatever is sent. `alpha_dash`
            // keeps it URL-safe without needing a separate sanitizer.
            'slug' => ['nullable', 'string', 'max:255', 'alpha_dash'],

            // The gallery, in display order. images[0] becomes the cover
            // (image_url) — enforced in ProductService, not here.
            'images' => ['nullable', 'array', 'max:20'],
            'images.*' => ['string', 'max:2048'],

            // Free-form specification groups. Every bound is deliberate:
            // this is a client-supplied nested structure written straight
            // into a jsonb column, so without limits a single request could
            // store an unbounded document.
            'specifications' => ['nullable', 'array', 'max:20'],
            'specifications.*.title_ar' => ['nullable', 'string', 'max:255'],
            'specifications.*.title_en' => ['nullable', 'string', 'max:255'],
            'specifications.*.fields' => ['required', 'array', 'max:50'],
            'specifications.*.fields.*.label_ar' => ['nullable', 'string', 'max:255'],
            'specifications.*.fields.*.label_en' => ['nullable', 'string', 'max:255'],
            'specifications.*.fields.*.value_ar' => ['nullable', 'string', 'max:2000'],
            'specifications.*.fields.*.value_en' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
