<?php

namespace Tests\Feature\Api\V1\Messages;

use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateMessageStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_change_a_messages_status(): void
    {
        $staff = User::factory()->create();
        $message = Message::factory()->create(['status' => 'new']);

        $response = $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/v1/admin/messages/{$message->id}/status", ['status' => 'replied']);

        $response->assertStatus(200);
        $this->assertSame('replied', $response->json('data.status'));
        $this->assertDatabaseHas('messages', ['id' => $message->id, 'status' => 'replied']);
    }

    public function test_invalid_status_fails_validation(): void
    {
        $staff = User::factory()->create();
        $message = Message::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/v1/admin/messages/{$message->id}/status", ['status' => 'bogus'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $message = Message::factory()->create();

        $this->patchJson("/api/v1/admin/messages/{$message->id}/status", ['status' => 'replied'])
            ->assertStatus(401);
    }
}
