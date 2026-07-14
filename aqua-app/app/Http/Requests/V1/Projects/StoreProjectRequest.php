<?php

namespace App\Http\Requests\V1\Projects;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
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
            'location_ar' => ['nullable', 'string', 'max:255'],
            'location_en' => ['nullable', 'string', 'max:255'],
            // Legacy plain-text field, predates category_id. Kept lenient —
            // not meaningfully validated further, since the public site
            // never reads it and it's not a cleanup target in this phase.
            'category' => ['nullable', 'string', 'max:255'],
            // Not a `url` rule: the current admin form falls back to a
            // relative placeholder path (/site/placeholder.jpg) when no
            // image is uploaded, and that literal value is saved as-is.
            'image_url' => ['nullable', 'string', 'max:2048'],
            // Plain string, not an integer — matches the current admin
            // form's free-text year field.
            'year' => ['nullable', 'string', 'max:10'],
            'is_featured' => ['nullable', 'boolean'],
            // Nullable and optional, unlike Products — the admin UI's
            // CategoryCascader has no `required` prop for Projects, and
            // every real exported row currently has category_id = null.
            'category_id' => ['nullable', 'uuid', 'exists:product_categories,id'],
            'sort_order' => ['nullable', 'integer'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
