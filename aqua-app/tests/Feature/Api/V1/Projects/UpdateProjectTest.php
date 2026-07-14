<?php

namespace Tests\Feature\Api\V1\Projects;

use App\Models\ProductCategory;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_update_a_project(): void
    {
        $staff = User::factory()->create();
        $project = Project::factory()->create(['title_ar' => 'قديم']);

        $response = $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/projects/{$project->id}", [
            'title_ar' => 'جديد',
            'title_en' => $project->title_en,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('projects', ['id' => $project->id, 'title_ar' => 'جديد']);
    }

    public function test_can_unset_a_projects_category(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'project']);
        $project = Project::factory()->create(['category_id' => $category->id]);

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/projects/{$project->id}", [
            'title_ar' => $project->title_ar,
            'title_en' => $project->title_en,
            'category_id' => null,
        ])->assertStatus(200);

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'category_id' => null]);
    }

    public function test_can_toggle_is_featured(): void
    {
        $staff = User::factory()->create();
        $project = Project::factory()->create(['is_featured' => false]);

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/projects/{$project->id}", [
            'title_ar' => $project->title_ar,
            'title_en' => $project->title_en,
            'is_featured' => true,
        ])->assertStatus(200);

        $this->assertDatabaseHas('projects', ['id' => $project->id, 'is_featured' => true]);
    }

    public function test_missing_title_fails_validation(): void
    {
        $staff = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/projects/{$project->id}", [
            'title_en' => 'Name',
        ])->assertStatus(422)->assertJsonValidationErrors('title_ar');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $project = Project::factory()->create();

        $this->patchJson("/api/v1/admin/projects/{$project->id}", [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
        ])->assertStatus(401);
    }
}
