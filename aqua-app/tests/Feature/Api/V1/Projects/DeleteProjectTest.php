<?php

namespace Tests\Feature\Api\V1\Projects;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_delete_a_project(): void
    {
        $staff = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/projects/{$project->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $project = Project::factory()->create();

        $this->deleteJson("/api/v1/admin/projects/{$project->id}")->assertStatus(401);
        $this->assertDatabaseHas('projects', ['id' => $project->id]);
    }
}
