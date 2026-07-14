<?php

namespace Tests\Feature\Api\V1\ProductCategories;

use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateProductCategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_create_a_root_category(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/product-categories', [
            'name_ar' => 'فسيفساء',
            'name_en' => 'Mosaic',
            'kind' => 'product',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('product_categories', [
            'name_ar' => 'فسيفساء',
            'kind' => 'product',
            'parent_id' => null,
            'sort_order' => 1,
        ]);
    }

    public function test_a_sub_category_inherits_its_parents_kind_regardless_of_submitted_kind(): void
    {
        $staff = User::factory()->create();
        $parent = ProductCategory::factory()->create(['kind' => 'service']);

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/product-categories', [
            'name_ar' => 'فرعي',
            'name_en' => 'Sub',
            'parent_id' => $parent->id,
            'kind' => 'project', // deliberately wrong — must be ignored
        ]);

        $response->assertStatus(201);
        $this->assertSame('service', $response->json('data.kind'));
        $this->assertDatabaseHas('product_categories', [
            'name_ar' => 'فرعي',
            'kind' => 'service',
            'parent_id' => $parent->id,
        ]);
    }

    public function test_missing_name_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/product-categories', [
            'name_en' => 'Only English',
            'kind' => 'product',
        ])->assertStatus(422)->assertJsonValidationErrors('name_ar');
    }

    public function test_invalid_kind_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/product-categories', [
            'name_ar' => 'اسم',
            'name_en' => 'Name',
            'kind' => 'bogus',
        ])->assertStatus(422)->assertJsonValidationErrors('kind');
    }

    public function test_root_category_requires_a_kind(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/product-categories', [
            'name_ar' => 'اسم',
            'name_en' => 'Name',
        ])->assertStatus(422)->assertJsonValidationErrors('kind');
    }

    public function test_nonexistent_parent_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/product-categories', [
            'name_ar' => 'اسم',
            'name_en' => 'Name',
            'parent_id' => '00000000-0000-0000-0000-000000000000',
        ])->assertStatus(422)->assertJsonValidationErrors('parent_id');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/product-categories', [
            'name_ar' => 'اسم',
            'name_en' => 'Name',
            'kind' => 'product',
        ])->assertStatus(401);
    }
}
