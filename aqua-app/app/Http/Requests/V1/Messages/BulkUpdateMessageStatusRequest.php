<?php

namespace App\Http\Requests\V1\Messages;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkUpdateMessageStatusRequest extends FormRequest
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
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['uuid', 'exists:messages,id'],
            'status' => ['required', Rule::in(['new', 'in_progress', 'replied', 'archived'])],
        ];
    }
}
