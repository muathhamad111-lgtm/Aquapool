<?php

namespace App\Services;

use App\Models\SiteSetting;
use App\Support\HtmlSanitizer;

class SiteSettingService
{
    /**
     * The only fields that ever contain rich HTML (from RichTextArea.tsx).
     * Everything else in every setting key is plain text.
     */
    private const RICH_TEXT_FIELDS = [
        'story_ar', 'story_en', 'mission_ar', 'mission_en', 'vision_ar', 'vision_en',
    ];

    public function __construct(private readonly HtmlSanitizer $sanitizer) {}

    /**
     * @return array<string, mixed> all settings keyed by their key name
     */
    public function all(): array
    {
        return SiteSetting::all()->pluck('value', 'key')->all();
    }

    public function update(string $key, array $value): SiteSetting
    {
        if ($key === 'about') {
            $value = $this->sanitizeRichTextFields($value);
        }

        return SiteSetting::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    /**
     * @param  array<string, mixed>  $value
     * @return array<string, mixed>
     */
    private function sanitizeRichTextFields(array $value): array
    {
        foreach (self::RICH_TEXT_FIELDS as $field) {
            if (isset($value[$field]) && is_string($value[$field])) {
                $value[$field] = $this->sanitizer->purify($value[$field]);
            }
        }

        return $value;
    }
}
