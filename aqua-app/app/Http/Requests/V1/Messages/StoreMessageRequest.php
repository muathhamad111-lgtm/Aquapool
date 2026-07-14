<?php

namespace App\Http\Requests\V1\Messages;

use Illuminate\Foundation\Http\FormRequest;

class StoreMessageRequest extends FormRequest
{
    /**
     * Public endpoint — anyone can submit, matching Supabase's
     * `anon, authenticated` insert grant. No policy check.
     */
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
            // Bounds match the original Supabase RLS CHECK constraint
            // exactly (name 1-120, email 3-255, message 1-4000) — `email`
            // additionally gets a real format check, a justified tightening
            // since Supabase only verified length, not shape.
            'name' => ['required', 'string', 'min:1', 'max:120'],
            'email' => ['required', 'string', 'email', 'min:3', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'project_type' => ['nullable', 'string', 'max:255'],
            'budget' => ['nullable', 'string', 'max:255'],
            'timeline' => ['nullable', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'min:1', 'max:4000'],
        ];
    }
}
