<?php

namespace Tests\Feature\Api\V1\Messages;

use App\Models\AuditLog;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BulkUpdateMessageStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_bulk_update_status(): void
    {
        $staff = User::factory()->create();
        $messages = Message::factory()->count(3)->create(['status' => 'new']);

        $response = $this->actingAs($staff, 'sanctum')->patchJson('/api/v1/admin/messages/status', [
            'ids' => $messages->pluck('id')->all(),
            'status' => 'archived',
        ]);

        $response->assertStatus(200);
        foreach ($messages as $message) {
            $this->assertDatabaseHas('messages', ['id' => $message->id, 'status' => 'archived']);
        }
    }

    public function test_bulk_update_writes_one_audit_log_entry_per_message(): void
    {
        $staff = User::factory()->create();
        $messages = Message::factory()->count(3)->create(['status' => 'new']);

        $this->actingAs($staff, 'sanctum')->patchJson('/api/v1/admin/messages/status', [
            'ids' => $messages->pluck('id')->all(),
            'status' => 'in_progress',
        ])->assertStatus(200);

        $this->assertDatabaseCount('audit_logs', 3);
        foreach ($messages as $message) {
            $this->assertDatabaseHas('audit_logs', [
                'entity_id' => $message->id,
                'action' => 'status_change',
            ]);
        }
        $log = AuditLog::where('entity_id', $messages->first()->id)->firstOrFail();
        // assertEquals, not assertSame: `details` is jsonb in PostgreSQL,
        // which normalizes key order. Key order carries no meaning here.
        $this->assertEquals(['from' => 'new', 'to' => 'in_progress'], $log->details);
    }

    public function test_nonexistent_id_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->patchJson('/api/v1/admin/messages/status', [
            'ids' => ['00000000-0000-0000-0000-000000000000'],
            'status' => 'archived',
        ])->assertStatus(422)->assertJsonValidationErrors('ids.0');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $message = Message::factory()->create();

        $this->patchJson('/api/v1/admin/messages/status', [
            'ids' => [$message->id],
            'status' => 'archived',
        ])->assertStatus(401);
    }
}
