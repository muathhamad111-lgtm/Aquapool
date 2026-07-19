<?php

namespace App\Http\Requests\V1\Messages;

use App\Enums\MessageStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexMessageRequest extends FormRequest
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
            'page' => ['integer', 'min:1'],
            // Capped so a client can't ask for the whole inbox in one
            // request and undo the point of paginating it.
            'per_page' => ['integer', 'min:1', 'max:100'],
            'status' => ['string', Rule::in(MessageStatus::values())],
            'search' => ['string', 'max:255'],
        ];
    }
}
