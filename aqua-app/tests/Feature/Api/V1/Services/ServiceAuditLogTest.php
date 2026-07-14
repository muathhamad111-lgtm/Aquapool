<?php

namespace Tests\Feature\Api\V1\Services;

use App\Models\AuditLog;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceAuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_service_writes_an_audit_log(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/services', [
            'icon' => 'droplets',
            'title_ar' => 'خدمة جديدة',
            'title_en' => 'New Service',
        ])->assertStatus(201);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $staff->id,
            'action' => 'create',
            'entity_type' => 'service',
            'entity_label' => 'خدمة جديدة',
        ]);
    }

    public function test_updating_a_service_writes_an_audit_log_with_a_diff(): void
    {
        $staff = User::factory()->create();
        $service = Service::factory()->create(['title_ar' => 'قديم']);

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/services/{$service->id}", [
            'icon' => $service->icon,
            'title_ar' => 'جديد',
            'title_en' => $service->title_en,
        ])->assertStatus(200);

        $log = AuditLog::where('entity_id', $service->id)->where('action', 'update')->firstOrFail();
        $this->assertSame(['قديم', 'جديد'], $log->details['changes']['title_ar']);
    }

    public function test_deleting_a_service_writes_an_audit_log(): void
    {
        $staff = User::factory()->create();
        $service = Service::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/services/{$service->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'entity_id' => $service->id,
            'action' => 'delete',
            'entity_type' => 'service',
        ]);
    }

    public function test_changes_without_an_authenticated_actor_do_not_write_an_audit_log(): void
    {
        $service = Service::factory()->create();
        $service->update(['title_ar' => 'تغيير من الطرفية']);
        $service->delete();

        $this->assertDatabaseCount('audit_logs', 0);
    }
}
