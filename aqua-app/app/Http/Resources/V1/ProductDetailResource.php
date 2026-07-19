<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;

/**
 * The single-product shape: everything ProductResource sends, plus the
 * specification groups. Kept out of the list resource so the catalogue
 * payload doesn't carry every product's full spec tables.
 */
class ProductDetailResource extends ProductResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'specifications' => $this->specifications ?? [],
        ];
    }
}
