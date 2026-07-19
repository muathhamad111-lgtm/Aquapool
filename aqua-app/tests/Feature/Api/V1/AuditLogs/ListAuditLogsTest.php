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
            'meta' => ['current_page', 'per_page', 'total', 'last_page', 'entity_counts'],
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

    public function test_results_are_paginated_with_a_default_page_size(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::factory()->count(30)->create();

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/audit-logs');

        $response->assertStatus(200)->assertJsonCount(25, 'data');
        $response->assertJsonPath('meta.total', 30);
        $response->assertJsonPath('meta.per_page', 25);
        $response->assertJsonPath('meta.last_page', 2);
    }

    public function test_a_later_page_returns_the_remaining_rows(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::factory()->count(30)->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs?page=2&per_page=25');

        $response->assertStatus(200)->assertJsonCount(5, 'data');
        $response->assertJsonPath('meta.current_page', 2);
    }

    /**
     * Regression guard for the paging contract itself: audit_logs has no
     * updated_at and a burst of rows can share a created_at second, so the
     * query needs a tiebreaker or rows silently duplicate/disappear between
     * pages. Every row must be seen exactly once across all pages.
     */
    public function test_paging_through_rows_with_identical_timestamps_loses_nothing(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::factory()->count(20)->create(['created_at' => now()]);

        $seen = [];
        foreach ([1, 2, 3, 4] as $page) {
            $response = $this->actingAs($admin, 'sanctum')
                ->getJson("/api/v1/admin/audit-logs?page={$page}&per_page=5");

            $seen = [...$seen, ...$response->json('data.*.id')];
        }

        $this->assertCount(20, $seen);
        $this->assertCount(20, array_unique($seen));
    }

    public function test_newest_entries_come_first(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::factory()->create(['entity_label' => 'older', 'created_at' => now()->subDay()]);
        AuditLog::factory()->create(['entity_label' => 'newer', 'created_at' => now()]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/audit-logs');

        $response->assertJsonPath('data.0.entity_label', 'newer');
    }

    public function test_results_can_be_filtered_by_entity_type(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::factory()->count(3)->create(['entity_type' => 'product']);
        AuditLog::factory()->count(2)->create(['entity_type' => 'service']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs?entity_type=product');

        $response->assertStatus(200)->assertJsonCount(3, 'data');
        $response->assertJsonPath('meta.total', 3);
    }

    public function test_search_matches_email_label_action_and_entity_type(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::factory()->create(['user_email' => 'zaid@example.com', 'entity_label' => 'unrelated', 'entity_type' => 'product', 'action' => 'create']);
        AuditLog::factory()->create(['user_email' => 'other@example.com', 'entity_label' => 'Pool Pump', 'entity_type' => 'product', 'action' => 'create']);
        AuditLog::factory()->create(['user_email' => 'other@example.com', 'entity_label' => 'unrelated', 'entity_type' => 'service', 'action' => 'delete']);

        $byEmail = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/audit-logs?search=zaid');
        $byEmail->assertJsonCount(1, 'data')->assertJsonPath('data.0.user_email', 'zaid@example.com');

        $byLabel = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/audit-logs?search=pump');
        $byLabel->assertJsonCount(1, 'data')->assertJsonPath('data.0.entity_label', 'Pool Pump');

        $byAction = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/audit-logs?search=delete');
        $byAction->assertJsonCount(1, 'data')->assertJsonPath('data.0.action', 'delete');

        $byEntityType = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/audit-logs?search=service');
        $byEntityType->assertJsonCount(1, 'data')->assertJsonPath('data.0.entity_type', 'service');
    }

    /**
     * Production is PostgreSQL, where LIKE is case-sensitive — the service
     * lower-cases both sides so search behaves the same there as on the
     * sqlite suite, which is case-insensitive for ASCII by default.
     */
    public function test_search_is_case_insensitive(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::factory()->create(['entity_label' => 'Pool Pump']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs?search=POOL')
            ->assertJsonCount(1, 'data');
    }

    public function test_entity_type_and_search_filters_combine(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::factory()->create(['entity_type' => 'product', 'entity_label' => 'Pool Pump']);
        AuditLog::factory()->create(['entity_type' => 'service', 'entity_label' => 'Pool Cleaning']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs?entity_type=product&search=pool');

        $response->assertJsonCount(1, 'data')->assertJsonPath('data.0.entity_label', 'Pool Pump');
    }

    /**
     * The filter chips show totals for the whole table, so the counts must
     * ignore the active filters — otherwise selecting one chip would zero
     * out every other chip's count.
     */
    public function test_entity_counts_cover_the_whole_table_not_just_the_filtered_page(): void
    {
        $admin = User::factory()->admin()->create();
        AuditLog::factory()->count(3)->create(['entity_type' => 'product']);
        AuditLog::factory()->count(2)->create(['entity_type' => 'service']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs?entity_type=product&per_page=1');

        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('meta.entity_counts.product', 3);
        $response->assertJsonPath('meta.entity_counts.service', 2);
    }

    public function test_per_page_above_the_cap_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs?per_page=5000')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    }

    public function test_invalid_page_is_rejected(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/audit-logs?page=0')
            ->assertStatus(422)
            ->assertJsonValidationErrors(['page']);
    }
}
