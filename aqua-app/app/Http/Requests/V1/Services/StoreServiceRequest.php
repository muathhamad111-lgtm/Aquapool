<?php

namespace App\Http\Requests\V1\Services;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreServiceRequest extends FormRequest
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
            'icon' => ['required', Rule::in(self::ICONS)],
            'title_ar' => ['required', 'string', 'max:255'],
            'title_en' => ['required', 'string', 'max:255'],
            'description_ar' => ['nullable', 'string', 'max:20000'],
            'description_en' => ['nullable', 'string', 'max:20000'],
            'category_id' => ['nullable', 'uuid', 'exists:product_categories,id'],
            'sort_order' => ['nullable', 'integer'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }

    /**
     * The full set the public site's icon map recognizes (services.tsx
     * ICON_MAP) — a superset of what the admin dropdown currently offers,
     * confirmed against real production data (which only uses a subset:
     * droplets, gem, shield, sparkles, sun, wrench) so this stays
     * permissive enough for the admin's own existing options.
     */
    private const ICONS = [
        'droplets', 'filter', 'lightbulb', 'shield', 'wrench',
        'sparkles', 'sun', 'gem', 'waves', 'leaf',
    ];
}
