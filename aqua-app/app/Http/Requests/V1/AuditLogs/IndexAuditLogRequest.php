<?php

namespace App\Http\Requests\V1\AuditLogs;

use Illuminate\Foundation\Http\FormRequest;

class IndexAuditLogRequest extends FormRequest
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
            // Capped so a client can't ask for the whole table in one
            // request and undo the point of paginating it.
            'per_page' => ['integer', 'min:1', 'max:100'],
            // Not an enum: entity types derive from model class names
            // (Str::snake(class_basename(...))), so a new module must not
            // require editing this rule to be filterable.
            'entity_type' => ['string', 'max:100'],
            'search' => ['string', 'max:255'],
        ];
    }
}
