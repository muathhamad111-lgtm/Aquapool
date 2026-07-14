<?php

namespace Tests\Feature\Api\V1\Messages;

use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_delete_a_message(): void
    {
        $staff = User::factory()->create();
        $message = Message::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/messages/{$message->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('messages', ['id' => $message->id]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $message = Message::factory()->create();

        $this->deleteJson("/api/v1/admin/messages/{$message->id}")->assertStatus(401);
        $this->assertDatabaseHas('messages', ['id' => $message->id]);
    }
}
