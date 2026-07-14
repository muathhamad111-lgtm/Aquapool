<?php

namespace Tests\Feature\Api\V1\ProductCategories;

use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateProductCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_update_a_categorys_name(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['name_ar' => 'قديم', 'name_en' => 'Old']);

        $response = $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/product-categories/{$category->id}", [
            'name_ar' => 'جديد',
            'name_en' => 'New',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('product_categories', [
            'id' => $category->id,
            'name_ar' => 'جديد',
            'name_en' => 'New',
        ]);
    }

    public function test_kind_and_parent_are_not_changeable_through_update(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'product', 'parent_id' => null]);

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/product-categories/{$category->id}", [
            'name_ar' => 'جديد',
            'name_en' => 'New',
            'kind' => 'project',
            'parent_id' => ProductCategory::factory()->create(['kind' => 'project'])->id,
        ])->assertStatus(200);

        $this->assertDatabaseHas('product_categories', [
            'id' => $category->id,
            'kind' => 'product',
            'parent_id' => null,
        ]);
    }

    public function test_missing_name_fails_validation(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create();

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/product-categories/{$category->id}", [
            'name_en' => 'Only English',
        ])->assertStatus(422)->assertJsonValidationErrors('name_ar');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $category = ProductCategory::factory()->create();

        $this->patchJson("/api/v1/admin/product-categories/{$category->id}", [
            'name_ar' => 'جديد',
            'name_en' => 'New',
        ])->assertStatus(401);
    }
}
