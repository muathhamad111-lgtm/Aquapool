<?php

namespace App\Http\Requests\V1\Products;

/**
 * Identical validation to StoreProductRequest — the admin edit form updates
 * every field in one request, same as Services.
 */
class UpdateProductRequest extends StoreProductRequest {}
