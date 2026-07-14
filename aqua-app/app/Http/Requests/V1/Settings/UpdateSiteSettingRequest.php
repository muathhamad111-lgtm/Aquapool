<?php

namespace App\Http\Requests\V1\Settings;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSiteSettingRequest extends FormRequest
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
        return match ($this->route('key')) {
            'hero' => [
                'value.tag_ar' => ['nullable', 'string', 'max:500'],
                'value.tag_en' => ['nullable', 'string', 'max:500'],
                'value.title_ar' => ['nullable', 'string', 'max:500'],
                'value.title_en' => ['nullable', 'string', 'max:500'],
                'value.subtitle_ar' => ['nullable', 'string', 'max:5000'],
                'value.subtitle_en' => ['nullable', 'string', 'max:5000'],
                'value.cta_label_ar' => ['nullable', 'string', 'max:200'],
                'value.cta_label_en' => ['nullable', 'string', 'max:200'],
                // Not editable via the admin UI yet (see docs/architecture.md) —
                // still validated so a value already present is never lost.
                'value.image_url' => ['nullable', 'string', 'max:2048'],
            ],
            'about' => [
                'value.story_ar' => ['nullable', 'string', 'max:20000'],
                'value.story_en' => ['nullable', 'string', 'max:20000'],
                'value.mission_ar' => ['nullable', 'string', 'max:20000'],
                'value.mission_en' => ['nullable', 'string', 'max:20000'],
                'value.vision_ar' => ['nullable', 'string', 'max:20000'],
                'value.vision_en' => ['nullable', 'string', 'max:20000'],
            ],
            'values' => [
                'value.eyebrow_ar' => ['nullable', 'string', 'max:200'],
                'value.eyebrow_en' => ['nullable', 'string', 'max:200'],
                'value.title_ar' => ['nullable', 'string', 'max:200'],
                'value.title_en' => ['nullable', 'string', 'max:200'],
                'value.items' => ['present', 'array', 'max:12'],
                'value.items.*.icon' => ['required', Rule::in([
                    'Award', 'Lightbulb', 'HeartHandshake', 'CheckCircle2', 'Shield',
                    'Sparkles', 'Users', 'Star', 'Gem', 'Trophy',
                ])],
                'value.items.*.title_ar' => ['required', 'string', 'max:100'],
                'value.items.*.title_en' => ['required', 'string', 'max:100'],
                'value.items.*.desc_ar' => ['required', 'string', 'max:500'],
                'value.items.*.desc_en' => ['required', 'string', 'max:500'],
            ],
            'contact' => [
                'value.phone' => ['nullable', 'string', 'max:50'],
                'value.whatsapp' => ['nullable', 'string', 'max:50'],
                'value.email' => ['nullable', 'email', 'max:255'],
                'value.address_ar' => ['nullable', 'string', 'max:500'],
                'value.address_en' => ['nullable', 'string', 'max:500'],
                'value.hours_ar' => ['nullable', 'string', 'max:300'],
                'value.hours_en' => ['nullable', 'string', 'max:300'],
                'value.instagram' => ['nullable', 'url', 'max:500'],
                'value.facebook' => ['nullable', 'url', 'max:500'],
                'value.twitter' => ['nullable', 'url', 'max:500'],
                'value.linkedin' => ['nullable', 'url', 'max:500'],
            ],
            default => [],
        };
    }
}
