<?php

namespace Tests\Feature\Api\V1\AuditLogs;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListAuditLogsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_audit_logs(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::create([
            'user_id' => $admin->id,
            'user_email' => $admin->email,
            'action' => 'create',
            'entity_type' => 'user',
            'entity_id' => '999',
            'entity_label' => 'someone@example.com',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/audit-logs');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
        $response->assertJsonStructure([
            'data' => [['id', 'user_id', 'user_email', 'action', 'entity_type', 'entity_id', 'entity_label', 'details', 'created_at']],
        ]);
    }

    public function test_staff_user_can_view_audit_logs(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/audit-logs')->assertStatus(200);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/audit-logs')->assertStatus(401);
    }

    public function test_no_write_endpoints_exist_for_audit_logs(): void
    {
        $admin = User::factory()->admin()->create();

        // Same path as the GET route, wrong method entirely.
        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/audit-logs', [])->assertStatus(405);
        // No route accepts an {id} segment for audit logs at all.
        $this->actingAs($admin, 'sanctum')->deleteJson('/api/v1/admin/audit-logs/1')->assertStatus(404);
    }
}
