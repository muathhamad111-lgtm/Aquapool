<?php

namespace Tests\Feature\Api\V1\Products;

use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_create_a_product(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'product']);

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/products', [
            'title_ar' => 'منتج جديد',
            'title_en' => 'New Product',
            'caption_ar' => 'وصف',
            'caption_en' => 'Caption',
            'price_label_ar' => 'السعر',
            'price_label_en' => 'Price',
            'category_id' => $category->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('products', [
            'title_ar' => 'منتج جديد',
            'category_id' => $category->id,
        ]);
    }

    public function test_category_id_is_required(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/products', [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
        ])->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_nonexistent_category_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/products', [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'category_id' => '00000000-0000-0000-0000-000000000000',
        ])->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_missing_title_fails_validation(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'product']);

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/products', [
            'title_en' => 'Name',
            'category_id' => $category->id,
        ])->assertStatus(422)->assertJsonValidationErrors('title_ar');
    }

    public function test_a_relative_placeholder_path_is_accepted_for_image_url(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'product']);

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/products', [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'category_id' => $category->id,
            'image_url' => '/site/placeholder.jpg',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('products', ['image_url' => '/site/placeholder.jpg']);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $category = ProductCategory::factory()->create(['kind' => 'product']);

        $this->postJson('/api/v1/admin/products', [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'category_id' => $category->id,
        ])->assertStatus(401);
    }
}
