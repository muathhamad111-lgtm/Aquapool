<?php

namespace Tests\Feature\Api\V1\Messages;

use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BulkDeleteMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_bulk_delete_messages(): void
    {
        $staff = User::factory()->create();
        $messages = Message::factory()->count(3)->create();

        $response = $this->actingAs($staff, 'sanctum')->deleteJson('/api/v1/admin/messages', [
            'ids' => $messages->pluck('id')->all(),
        ]);

        $response->assertStatus(200);
        foreach ($messages as $message) {
            $this->assertDatabaseMissing('messages', ['id' => $message->id]);
        }
    }

    public function test_bulk_delete_writes_one_audit_log_entry_per_message(): void
    {
        $staff = User::factory()->create();
        $messages = Message::factory()->count(3)->create();

        $this->actingAs($staff, 'sanctum')->deleteJson('/api/v1/admin/messages', [
            'ids' => $messages->pluck('id')->all(),
        ])->assertStatus(200);

        $this->assertDatabaseCount('audit_logs', 3);
        foreach ($messages as $message) {
            $this->assertDatabaseHas('audit_logs', [
                'entity_id' => $message->id,
                'action' => 'delete',
            ]);
        }
    }

    public function test_a_message_not_in_the_batch_is_left_untouched(): void
    {
        $staff = User::factory()->create();
        $toDelete = Message::factory()->create();
        $untouched = Message::factory()->create();

        $this->actingAs($staff, 'sanctum')->deleteJson('/api/v1/admin/messages', [
            'ids' => [$toDelete->id],
        ])->assertStatus(200);

        $this->assertDatabaseMissing('messages', ['id' => $toDelete->id]);
        $this->assertDatabaseHas('messages', ['id' => $untouched->id]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $message = Message::factory()->create();

        $this->deleteJson('/api/v1/admin/messages', ['ids' => [$message->id]])->assertStatus(401);
        $this->assertDatabaseHas('messages', ['id' => $message->id]);
    }
}
