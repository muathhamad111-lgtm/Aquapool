<?php

namespace App\Http\Requests\V1\Uploads;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreImageUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization happens once, via a direct isStaff() check in the
        // controller — there's no Eloquent subject for a Policy to gate
        // here (this endpoint isn't a CRUD resource for a model).
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'image', 'max:5120'],
            'folder' => ['required', 'string', Rule::in(['products', 'projects'])],
        ];
    }
}
