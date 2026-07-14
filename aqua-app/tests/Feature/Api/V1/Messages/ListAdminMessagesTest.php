<?php

namespace Tests\Feature\Api\V1\Messages;

use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListAdminMessagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_all_messages(): void
    {
        $admin = User::factory()->admin()->create();
        Message::factory()->count(3)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/messages');

        $response->assertStatus(200)->assertJsonCount(3, 'data');
    }

    public function test_staff_user_can_view_messages(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/messages')->assertStatus(200);
    }

    public function test_messages_are_ordered_by_created_at_descending(): void
    {
        $staff = User::factory()->create();
        $older = Message::factory()->create(['created_at' => now()->subDay()]);
        $newer = Message::factory()->create(['created_at' => now()]);

        $response = $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/messages');

        $this->assertSame($newer->id, $response->json('data.0.id'));
        $this->assertSame($older->id, $response->json('data.1.id'));
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/messages')->assertStatus(401);
    }
}
