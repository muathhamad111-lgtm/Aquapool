<?php

namespace Tests\Feature\Api\V1\Products;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListPublicProductsTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_only_published_products_ordered_by_sort_order(): void
    {
        Product::factory()->create(['title_ar' => 'B', 'is_published' => true, 'sort_order' => 2]);
        Product::factory()->create(['title_ar' => 'A', 'is_published' => true, 'sort_order' => 1]);
        Product::factory()->create(['title_ar' => 'Hidden', 'is_published' => false, 'sort_order' => 0]);

        $response = $this->getJson('/api/v1/products');

        $response->assertStatus(200)->assertJsonCount(2, 'data');
        $this->assertSame('A', $response->json('data.0.title_ar'));
        $this->assertSame('B', $response->json('data.1.title_ar'));
    }

    public function test_no_auth_required(): void
    {
        $this->getJson('/api/v1/products')->assertStatus(200);
    }
}
