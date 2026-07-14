<?php

namespace Tests\Feature\Api\V1\Products;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_update_a_product(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'product']);
        $product = Product::factory()->create(['title_ar' => 'قديم', 'category_id' => $category->id]);

        $response = $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/products/{$product->id}", [
            'title_ar' => 'جديد',
            'title_en' => $product->title_en,
            'category_id' => $category->id,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'title_ar' => 'جديد']);
    }

    public function test_category_id_is_required_on_update(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'product']);
        $product = Product::factory()->create(['category_id' => $category->id]);

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/products/{$product->id}", [
            'title_ar' => $product->title_ar,
            'title_en' => $product->title_en,
        ])->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_missing_title_fails_validation(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'product']);
        $product = Product::factory()->create(['category_id' => $category->id]);

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/products/{$product->id}", [
            'title_en' => 'Name',
            'category_id' => $category->id,
        ])->assertStatus(422)->assertJsonValidationErrors('title_ar');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $category = ProductCategory::factory()->create(['kind' => 'product']);
        $product = Product::factory()->create(['category_id' => $category->id]);

        $this->patchJson("/api/v1/admin/products/{$product->id}", [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'category_id' => $category->id,
        ])->assertStatus(401);
    }
}
