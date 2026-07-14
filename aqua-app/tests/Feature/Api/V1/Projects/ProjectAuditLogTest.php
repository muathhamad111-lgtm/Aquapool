<?php

namespace Tests\Feature\Api\V1\Projects;

use App\Models\AuditLog;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectAuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_project_writes_an_audit_log(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/projects', [
            'title_ar' => 'مشروع جديد',
            'title_en' => 'New Project',
        ])->assertStatus(201);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $staff->id,
            'action' => 'create',
            'entity_type' => 'project',
            'entity_label' => 'مشروع جديد',
        ]);
    }

    public function test_updating_a_project_writes_an_audit_log_with_a_diff(): void
    {
        $staff = User::factory()->create();
        $project = Project::factory()->create(['title_ar' => 'قديم']);

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/projects/{$project->id}", [
            'title_ar' => 'جديد',
            'title_en' => $project->title_en,
        ])->assertStatus(200);

        $log = AuditLog::where('entity_id', $project->id)->where('action', 'update')->firstOrFail();
        $this->assertSame(['قديم', 'جديد'], $log->details['changes']['title_ar']);
    }

    public function test_deleting_a_project_writes_an_audit_log(): void
    {
        $staff = User::factory()->create();
        $project = Project::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/projects/{$project->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'entity_id' => $project->id,
            'action' => 'delete',
            'entity_type' => 'project',
        ]);
    }

    public function test_changes_without_an_authenticated_actor_do_not_write_an_audit_log(): void
    {
        $project = Project::factory()->create();
        $project->update(['title_ar' => 'تغيير من الطرفية']);
        $project->delete();

        $this->assertDatabaseCount('audit_logs', 0);
    }
}
