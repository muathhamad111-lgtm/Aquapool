<?php

namespace App\Services;

use App\Models\Service;
use App\Support\HtmlSanitizer;
use Illuminate\Database\Eloquent\Collection;

class ServiceService
{
    public function __construct(private readonly HtmlSanitizer $sanitizer) {}

    /**
     * @return Collection<int, Service>
     */
    public function all(): Collection
    {
        return Service::orderBy('sort_order')->get();
    }

    /**
     * @return Collection<int, Service>
     */
    public function publicList(): Collection
    {
        return Service::where('is_published', true)->orderBy('sort_order')->get();
    }

    public function create(array $attributes): Service
    {
        return Service::create($this->sanitizeDescriptions($attributes));
    }

    public function update(Service $service, array $attributes): Service
    {
        $service->update($this->sanitizeDescriptions($attributes));

        return $service;
    }

    public function delete(Service $service): void
    {
        $service->delete();
    }

    private function sanitizeDescriptions(array $attributes): array
    {
        foreach (['description_ar', 'description_en'] as $field) {
            if (isset($attributes[$field]) && is_string($attributes[$field])) {
                $attributes[$field] = $this->sanitizer->purify($attributes[$field]);
            }
        }

        return $attributes;
    }
}
