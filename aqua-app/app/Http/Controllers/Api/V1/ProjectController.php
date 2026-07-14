<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\Projects\StoreProjectRequest;
use App\Http\Requests\V1\Projects\UpdateProjectRequest;
use App\Http\Resources\V1\ProjectResource;
use App\Models\Project;
use App\Services\ProjectService;
use Illuminate\Http\JsonResponse;

class ProjectController extends ApiController
{
    public function __construct(private readonly ProjectService $projects) {}

    public function publicIndex(): JsonResponse
    {
        return $this->success(ProjectResource::collection($this->projects->publicList()));
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Project::class);

        return $this->success(ProjectResource::collection($this->projects->all()));
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $this->authorize('create', Project::class);

        $project = $this->projects->create($request->validated());

        return $this->created(new ProjectResource($project));
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('update', Project::class);

        $project = $this->projects->update($project, $request->validated());

        return $this->success(new ProjectResource($project));
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->authorize('delete', Project::class);

        $this->projects->delete($project);

        return $this->success(message: 'Project deleted.');
    }
}
