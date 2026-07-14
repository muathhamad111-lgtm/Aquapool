<?php

namespace Tests\Feature\Api\V1\Products;

use App\Models\AuditLog;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductAuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_product_writes_an_audit_log(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'product']);

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/products', [
            'title_ar' => 'منتج جديد',
            'title_en' => 'New Product',
            'category_id' => $category->id,
        ])->assertStatus(201);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $staff->id,
            'action' => 'create',
            'entity_type' => 'product',
            'entity_label' => 'منتج جديد',
        ]);
    }

    public function test_updating_a_product_writes_an_audit_log_with_a_diff(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'product']);
        $product = Product::factory()->create(['title_ar' => 'قديم', 'category_id' => $category->id]);

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/products/{$product->id}", [
            'title_ar' => 'جديد',
            'title_en' => $product->title_en,
            'category_id' => $category->id,
        ])->assertStatus(200);

        $log = AuditLog::where('entity_id', $product->id)->where('action', 'update')->firstOrFail();
        $this->assertSame(['قديم', 'جديد'], $log->details['changes']['title_ar']);
    }

    public function test_deleting_a_product_writes_an_audit_log(): void
    {
        $staff = User::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/products/{$product->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'entity_id' => $product->id,
            'action' => 'delete',
            'entity_type' => 'product',
        ]);
    }

    public function test_changes_without_an_authenticated_actor_do_not_write_an_audit_log(): void
    {
        $product = Product::factory()->create();
        $product->update(['title_ar' => 'تغيير من الطرفية']);
        $product->delete();

        $this->assertDatabaseCount('audit_logs', 0);
    }
}
