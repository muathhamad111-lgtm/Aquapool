<?php

namespace App\Http\Requests\V1\Branches;

use Illuminate\Foundation\Http\FormRequest;

class StoreBranchRequest extends FormRequest
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
            // Only the name is required, matching every other module's
            // title. A real branch may have no street, no district, or no
            // dedicated email — requiring them would force placeholder data.
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],

            'country_ar' => ['nullable', 'string', 'max:255'],
            'country_en' => ['nullable', 'string', 'max:255'],
            'region_ar' => ['nullable', 'string', 'max:255'],
            'region_en' => ['nullable', 'string', 'max:255'],
            'district_ar' => ['nullable', 'string', 'max:255'],
            'district_en' => ['nullable', 'string', 'max:255'],
            'street_ar' => ['nullable', 'string', 'max:255'],
            'street_en' => ['nullable', 'string', 'max:255'],

            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],

            // Schemes are pinned to http/https rather than left to the
            // generic `url` rule: this value is rendered straight into an
            // href, and `javascript:` is a valid URL as far as that rule is
            // concerned. Not restricted to Google's domains — a branch may
            // reasonably be pinned on another map service.
            'map_url' => ['nullable', 'url:http,https', 'max:2048'],

            'hours_ar' => ['nullable', 'string', 'max:255'],
            'hours_en' => ['nullable', 'string', 'max:255'],

            'sort_order' => ['nullable', 'integer'],
            'is_published' => ['nullable', 'boolean'],
        ];
    }
}
