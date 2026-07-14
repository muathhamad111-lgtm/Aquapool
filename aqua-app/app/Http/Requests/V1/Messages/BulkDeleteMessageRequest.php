<?php

namespace App\Http\Requests\V1\Messages;

use Illuminate\Foundation\Http\FormRequest;

class BulkDeleteMessageRequest extends FormRequest
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
        ];
    }
}
