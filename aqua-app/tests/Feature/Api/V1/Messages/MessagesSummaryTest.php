<?php

namespace Tests\Feature\Api\V1\Messages;

use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessagesSummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_totals_by_status_and_five_most_recent(): void
    {
        $staff = User::factory()->create();
        Message::factory()->count(2)->create(['status' => 'new']);
        Message::factory()->count(1)->create(['status' => 'replied']);
        Message::factory()->count(7)->create(['status' => 'archived']);

        $response = $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/messages/summary');

        $response->assertStatus(200);
        $this->assertSame(10, $response->json('data.total'));
        $this->assertSame(2, $response->json('data.by_status.new'));
        $this->assertSame(1, $response->json('data.by_status.replied'));
        $this->assertSame(7, $response->json('data.by_status.archived'));
        $this->assertSame(0, $response->json('data.by_status.in_progress'));
        $this->assertCount(5, $response->json('data.recent'));
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/messages/summary')->assertStatus(401);
    }
}
