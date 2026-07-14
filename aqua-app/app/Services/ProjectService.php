<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Database\Eloquent\Collection;

class ProjectService
{
    /**
     * @return Collection<int, Project>
     */
    public function all(): Collection
    {
        return Project::orderBy('sort_order')->get();
    }

    /**
     * @return Collection<int, Project>
     */
    public function publicList(): Collection
    {
        return Project::where('is_published', true)->orderBy('sort_order')->get();
    }

    public function create(array $attributes): Project
    {
        return Project::create($attributes);
    }

    public function update(Project $project, array $attributes): Project
    {
        $project->update($attributes);

        return $project;
    }

    public function delete(Project $project): void
    {
        $project->delete();
    }
}
