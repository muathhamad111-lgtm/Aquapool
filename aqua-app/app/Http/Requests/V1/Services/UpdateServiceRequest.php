<?php

namespace App\Http\Requests\V1\Services;

/**
 * Identical validation to StoreServiceRequest — unlike Categories, the
 * Services edit form updates every field (icon, title, description,
 * category, sort_order, is_published) in one request, not just the name.
 */
class UpdateServiceRequest extends StoreServiceRequest {}
