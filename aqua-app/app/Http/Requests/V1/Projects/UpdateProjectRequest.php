<?php

namespace App\Http\Requests\V1\Projects;

/**
 * Identical validation to StoreProjectRequest — the admin edit form updates
 * every field in one request, same as Products and Services.
 */
class UpdateProjectRequest extends StoreProjectRequest {}
