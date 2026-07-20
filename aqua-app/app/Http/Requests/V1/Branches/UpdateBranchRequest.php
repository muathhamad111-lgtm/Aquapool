<?php

namespace App\Http\Requests\V1\Branches;

/**
 * Identical validation to StoreBranchRequest — the admin edit form updates
 * every field in one request, same as every other module.
 */
class UpdateBranchRequest extends StoreBranchRequest {}
