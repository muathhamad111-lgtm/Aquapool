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

    public function test_results_are_paginated_with_a_default_page_size(): void
    {
        $staff = User::factory()->create();
        Message::factory()->count(30)->create();

        $response = $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/messages');

        $response->assertStatus(200)->assertJsonCount(25, 'data');
        $response->assertJsonPath('meta.total', 30);
        $response->assertJsonPath('meta.per_page', 25);
        $response->assertJsonPath('meta.last_page', 2);
    }

    public function test_a_later_page_returns_the_remaining_rows(): void
    {
        $staff = User::factory()->create();
        Message::factory()->count(30)->create();

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/messages?page=2&per_page=25');

        $response->assertStatus(200)->assertJsonCount(5, 'data');
        $response->assertJsonPath('meta.current_page', 2);
    }

    /**
     * Messages have no updated_at and a burst of submissions can share a
     * created_at second, so the query needs a tiebreaker or rows silently
     * duplicate/disappear between pages.
     */
    public function test_paging_through_rows_with_identical_timestamps_loses_nothing(): void
    {
        $staff = User::factory()->create();
        Message::factory()->count(20)->create(['created_at' => now()]);

        $seen = [];
        foreach ([1, 2, 3, 4] as $page) {
            $response = $this->actingAs($staff, 'sanctum')
                ->getJson("/api/v1/admin/messages?page={$page}&per_page=5");

            $seen = [...$seen, ...$response->json('data.*.id')];
        }

        $this->assertCount(20, $seen);
        $this->assertCount(20, array_unique($seen));
    }

    public function test_results_can_be_filtered_by_status(): void
    {
        $staff = User::factory()->create();
        Message::factory()->count(3)->create(['status' => 'new']);
        Message::factory()->count(2)->create(['status' => 'archived']);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/messages?status=archived');

        $response->assertStatus(200)->assertJsonCount(2, 'data');
        $response->assertJsonPath('meta.total', 2);
    }

    public function test_search_matches_name_email_subject_and_body(): void
    {
        $staff = User::factory()->create();
        Message::factory()->create(['name' => 'زيد', 'email' => 'a@example.com', 'subject' => 'x', 'message' => 'y']);
        Message::factory()->create(['name' => 'a', 'email' => 'target@example.com', 'subject' => 'x', 'message' => 'y']);
        Message::factory()->create(['name' => 'b', 'email' => 'c@example.com', 'subject' => 'Pool Cover', 'message' => 'y']);
        Message::factory()->create(['name' => 'd', 'email' => 'e@example.com', 'subject' => 'x', 'message' => 'needs a heater']);

        // urlencode() because the test client, unlike a browser's
        // URLSearchParams, does not encode raw UTF-8 in a query string.
        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/messages?search='.urlencode('زيد'))
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'زيد');

        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/messages?search=target')
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.email', 'target@example.com');

        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/messages?search=cover')
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.subject', 'Pool Cover');

        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/messages?search=heater')
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.message', 'needs a heater');
    }

    /**
     * Production is PostgreSQL, where LIKE is case-sensitive — the service
     * lower-cases both sides so search behaves the same there as on the
     * sqlite suite.
     */
    public function test_search_is_case_insensitive(): void
    {
        $staff = User::factory()->create();
        Message::factory()->create(['subject' => 'Pool Cover']);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/messages?search=POOL')
            ->assertJsonCount(1, 'data');
    }

    public function test_status_and_search_filters_combine(): void
    {
        $staff = User::factory()->create();
        Message::factory()->create(['status' => 'new', 'subject' => 'Pool Cover']);
        Message::factory()->create(['status' => 'archived', 'subject' => 'Pool Pump']);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/messages?status=new&search=pool');

        $response->assertJsonCount(1, 'data')->assertJsonPath('data.0.subject', 'Pool Cover');
    }

    /**
     * The status chips show inbox-wide totals, so the counts must ignore
     * the active filters — otherwise selecting one chip would zero out
     * every other chip's count.
     */
    public function test_status_counts_cover_the_whole_inbox_not_just_the_filtered_page(): void
    {
        $staff = User::factory()->create();
        Message::factory()->count(3)->create(['status' => 'new']);
        Message::factory()->count(2)->create(['status' => 'replied']);

        $response = $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/messages?status=new&per_page=1');

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('meta.status_counts.new', 3);
        $response->assertJsonPath('meta.status_counts.replied', 2);
        // Every status is always present, zero included — a client
        // rendering one chip per status shouldn't have to handle a
        // missing key as if it meant zero.
        $response->assertJsonPath('meta.status_counts.archived', 0);
        $response->assertJsonPath('meta.status_counts.in_progress', 0);
    }

    public function test_an_unknown_status_filter_is_rejected(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/messages?status=not-a-status')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_per_page_above_the_cap_is_rejected(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/messages?per_page=5000')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    }
}
