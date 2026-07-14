<?php

namespace Tests\Feature\Api\V1\ProductCategories;

use App\Models\AuditLog;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCategoryAuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_category_writes_an_audit_log(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/product-categories', [
            'name_ar' => 'فسيفساء',
            'name_en' => 'Mosaic',
            'kind' => 'product',
        ])->assertStatus(201);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $staff->id,
            'action' => 'create',
            'entity_type' => 'product_category',
            'entity_label' => 'فسيفساء',
        ]);
    }

    public function test_updating_a_category_writes_an_audit_log_with_a_diff(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['name_ar' => 'قديم', 'name_en' => 'Old']);

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/product-categories/{$category->id}", [
            'name_ar' => 'جديد',
            'name_en' => 'New',
        ])->assertStatus(200);

        $log = AuditLog::where('entity_id', $category->id)->where('action', 'update')->firstOrFail();
        $this->assertSame(['قديم', 'جديد'], $log->details['changes']['name_ar']);
        $this->assertSame(['Old', 'New'], $log->details['changes']['name_en']);
    }

    public function test_deleting_a_category_with_descendants_writes_one_audit_log_per_deleted_row(): void
    {
        $staff = User::factory()->create();
        $root = ProductCategory::factory()->create(['kind' => 'product']);
        $child = ProductCategory::factory()->create(['kind' => 'product', 'parent_id' => $root->id]);

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/product-categories/{$root->id}")
            ->assertStatus(200);

        // One entry for the parent, one for the child — proves the explicit
        // recursive delete (not a DB cascade) preserves the audit trail for
        // every row that actually got deleted.
        $this->assertDatabaseCount('audit_logs', 2);
        $this->assertDatabaseHas('audit_logs', ['entity_id' => $root->id, 'action' => 'delete']);
        $this->assertDatabaseHas('audit_logs', ['entity_id' => $child->id, 'action' => 'delete']);
    }

    public function test_changes_without_an_authenticated_actor_do_not_write_an_audit_log(): void
    {
        $category = ProductCategory::factory()->create();
        $category->update(['name_ar' => 'تغيير من الطرفية']);
        $category->delete();

        $this->assertDatabaseCount('audit_logs', 0);
    }
}
