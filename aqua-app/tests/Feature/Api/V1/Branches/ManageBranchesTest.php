<?php

namespace Tests\Feature\Api\V1\Branches;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManageBranchesTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return [
            'name_ar' => 'فرع جدة',
            'name_en' => 'Jeddah Branch',
            'country_ar' => 'المملكة العربية السعودية',
            'country_en' => 'Saudi Arabia',
            'region_ar' => 'جدة',
            'region_en' => 'Jeddah',
            'district_ar' => 'الروضة',
            'district_en' => 'Ar Rawdah',
            'street_ar' => 'شارع الأمير سلطان',
            'street_en' => 'Prince Sultan Street',
            'email' => 'jeddah@example.com',
            'phone' => '+966 12 000 0000',
            ...$overrides,
        ];
    }

    public function test_staff_can_list_every_branch_including_unpublished(): void
    {
        $staff = User::factory()->create();
        Branch::factory()->create();
        Branch::factory()->unpublished()->create();

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/branches')
            ->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_staff_can_create_a_branch(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/branches', $this->payload());

        $response->assertStatus(201)
            ->assertJsonPath('data.name_ar', 'فرع جدة')
            ->assertJsonPath('data.region_en', 'Jeddah')
            ->assertJsonPath('data.is_published', true);

        $this->assertDatabaseHas('branches', ['name_en' => 'Jeddah Branch']);
    }

    /**
     * Only the name is required. A branch may genuinely have no street, no
     * district and no dedicated email; requiring them would force the admin
     * to invent placeholder data.
     */
    /**
     * Regression guard: `is_published` and `sort_order` are database
     * defaults, so a model built from only the submitted attributes reports
     * them as null. The response has to describe the row that was actually
     * stored, or a client would show a live branch as hidden.
     */
    public function test_the_create_response_reflects_database_defaults(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/branches', [
            'name_ar' => 'فرع بلا خيارات',
            'name_en' => 'Defaults Branch',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.is_published', true)
            ->assertJsonPath('data.sort_order', 0);
    }

    public function test_a_branch_can_be_created_with_only_a_name(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/branches', [
            'name_ar' => 'فرع مؤقت',
            'name_en' => 'Temporary Branch',
        ]);

        $response->assertStatus(201);
        $this->assertNull($response->json('data.street_ar'));
        $this->assertNull($response->json('data.email'));
    }

    public function test_a_missing_name_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/branches', $this->payload(['name_ar' => '', 'name_en' => '']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name_ar', 'name_en']);
    }

    public function test_an_invalid_email_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/branches', $this->payload(['email' => 'not-an-email']))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_staff_can_update_a_branch(): void
    {
        $staff = User::factory()->create();
        $branch = Branch::factory()->create(['name_ar' => 'قديم']);

        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/v1/admin/branches/{$branch->id}", $this->payload(['name_ar' => 'جديد']))
            ->assertStatus(200)
            ->assertJsonPath('data.name_ar', 'جديد');
    }

    public function test_staff_can_delete_a_branch(): void
    {
        $staff = User::factory()->create();
        $branch = Branch::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/branches/{$branch->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('branches', ['id' => $branch->id]);
    }

    public function test_a_branch_can_be_hidden_from_the_public_site(): void
    {
        $staff = User::factory()->create();
        $branch = Branch::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/v1/admin/branches/{$branch->id}", $this->payload(['is_published' => false]))
            ->assertStatus(200);

        $this->getJson('/api/v1/branches')->assertJsonCount(0, 'data');
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $branch = Branch::factory()->create();

        $this->getJson('/api/v1/admin/branches')->assertStatus(401);
        $this->postJson('/api/v1/admin/branches', $this->payload())->assertStatus(401);
        $this->patchJson("/api/v1/admin/branches/{$branch->id}", $this->payload())->assertStatus(401);
        $this->deleteJson("/api/v1/admin/branches/{$branch->id}")->assertStatus(401);
    }

    public function test_branch_changes_are_audited(): void
    {
        $staff = User::factory()->create();

        $created = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/admin/branches', $this->payload());

        $this->assertDatabaseHas('audit_logs', [
            'entity_type' => 'branch',
            'entity_id' => $created->json('data.id'),
            'action' => 'create',
            'entity_label' => 'فرع جدة',
            'user_id' => $staff->id,
        ]);
    }
}
