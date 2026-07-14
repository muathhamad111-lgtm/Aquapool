<?php

namespace Tests\Feature\Api\V1\ProductCategories;

use App\Models\ProductCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListPublicProductCategoriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_only_published_categories_for_the_given_kind(): void
    {
        ProductCategory::factory()->create(['kind' => 'product', 'is_published' => true, 'name_ar' => 'A']);
        ProductCategory::factory()->create(['kind' => 'product', 'is_published' => false, 'name_ar' => 'B']);
        ProductCategory::factory()->create(['kind' => 'service', 'is_published' => true, 'name_ar' => 'C']);

        $response = $this->getJson('/api/v1/product-categories?kind=product');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
        $this->assertSame('A', $response->json('data.0.name_ar'));
    }

    public function test_missing_kind_is_rejected(): void
    {
        $this->getJson('/api/v1/product-categories')->assertStatus(422);
    }

    public function test_invalid_kind_is_rejected(): void
    {
        $this->getJson('/api/v1/product-categories?kind=bogus')->assertStatus(422);
    }
}
