<?php

namespace Tests\Feature\Api\V1\Messages;

use App\Models\AuditLog;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageAuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_single_status_change_writes_a_status_change_audit_log(): void
    {
        $staff = User::factory()->create();
        $message = Message::factory()->create([
            'name' => 'أحمد',
            'email' => 'ahmed@example.com',
            'status' => 'new',
        ]);

        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/v1/admin/messages/{$message->id}/status", ['status' => 'replied'])
            ->assertStatus(200);

        $log = AuditLog::where('entity_id', $message->id)->firstOrFail();
        $this->assertSame('status_change', $log->action);
        $this->assertSame('message', $log->entity_type);
        $this->assertSame('أحمد — ahmed@example.com', $log->entity_label);
        // assertEquals, not assertSame: `details` is jsonb in PostgreSQL,
        // which normalizes key order. Key order carries no meaning here.
        $this->assertEquals(['from' => 'new', 'to' => 'replied'], $log->details);
        $this->assertSame($staff->id, $log->user_id);
    }

    public function test_deleting_a_message_writes_a_delete_audit_log(): void
    {
        $staff = User::factory()->create();
        $message = Message::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/messages/{$message->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'entity_id' => $message->id,
            'action' => 'delete',
            'entity_type' => 'message',
        ]);
    }

    public function test_changes_without_an_authenticated_actor_do_not_write_an_audit_log(): void
    {
        $message = Message::factory()->create();
        $message->update(['status' => 'archived']);
        $message->delete();

        $this->assertDatabaseCount('audit_logs', 0);
    }
}
