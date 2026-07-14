<?php

namespace Tests\Feature\Api\V1\ProductCategories;

use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteProductCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_delete_a_leaf_category(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/product-categories/{$category->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('product_categories', ['id' => $category->id]);
    }

    public function test_deleting_a_category_with_descendants_deletes_all_of_them(): void
    {
        $staff = User::factory()->create();
        $root = ProductCategory::factory()->create(['kind' => 'product']);
        $child = ProductCategory::factory()->create(['kind' => 'product', 'parent_id' => $root->id]);
        $grandchild = ProductCategory::factory()->create(['kind' => 'product', 'parent_id' => $child->id]);

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/product-categories/{$root->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('product_categories', ['id' => $root->id]);
        $this->assertDatabaseMissing('product_categories', ['id' => $child->id]);
        $this->assertDatabaseMissing('product_categories', ['id' => $grandchild->id]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $category = ProductCategory::factory()->create();

        $this->deleteJson("/api/v1/admin/product-categories/{$category->id}")->assertStatus(401);
        $this->assertDatabaseHas('product_categories', ['id' => $category->id]);
    }
}
