<?php

namespace App\Http\Requests\V1\ProductCategories;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductCategoryRequest extends FormRequest
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
            'name_ar' => ['required', 'string', 'max:255'],
            'name_en' => ['required', 'string', 'max:255'],
            'parent_id' => ['nullable', 'uuid', 'exists:product_categories,id'],
            // Only meaningful for a root category — a sub-category's kind
            // is force-inherited from its parent by ProductCategoryService,
            // regardless of what's submitted here.
            'kind' => ['required_without:parent_id', 'nullable', Rule::in(['product', 'service', 'project'])],
        ];
    }
}
