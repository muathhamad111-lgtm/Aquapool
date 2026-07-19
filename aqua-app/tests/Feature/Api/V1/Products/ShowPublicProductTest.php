<?php

namespace Tests\Feature\Api\V1\Products;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShowPublicProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_published_product_is_returned_by_slug(): void
    {
        $product = Product::factory()->create([
            'slug' => 'swimming-pool-water-pump',
            'title_en' => 'Swimming pool water pump',
            'is_published' => true,
        ]);

        $response = $this->getJson('/api/v1/products/swimming-pool-water-pump');

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $product->id);
        $response->assertJsonPath('data.slug', 'swimming-pool-water-pump');
        $response->assertJsonStructure([
            'data' => ['id', 'slug', 'title_ar', 'title_en', 'image_url', 'images', 'specifications'],
        ]);
    }

    /**
     * 404, not 403: a public visitor must not be able to tell an unpublished
     * product apart from one that never existed.
     */
    public function test_an_unpublished_product_is_not_found(): void
    {
        Product::factory()->create(['slug' => 'hidden-pump', 'is_published' => false]);

        $this->getJson('/api/v1/products/hidden-pump')->assertStatus(404);
    }

    public function test_an_unknown_slug_is_not_found(): void
    {
        $this->getJson('/api/v1/products/no-such-product')
            ->assertStatus(404)
            ->assertExactJson(['message' => 'Resource not found.']);
    }

    public function test_no_auth_is_required(): void
    {
        Product::factory()->create(['slug' => 'public-pump', 'is_published' => true]);

        $this->getJson('/api/v1/products/public-pump')->assertStatus(200);
    }

    public function test_specification_groups_are_returned_intact(): void
    {
        $specifications = [
            [
                'title_ar' => 'الخصائص الرئيسية',
                'title_en' => 'Key attributes',
                'fields' => [
                    ['label_ar' => 'النوع', 'label_en' => 'Type', 'value_ar' => 'مسبح', 'value_en' => 'Pool'],
                    ['label_ar' => 'الماركة', 'label_en' => 'Brand Name', 'value_ar' => 'فنلين', 'value_en' => 'Fenlin'],
                ],
            ],
            [
                'title_ar' => 'التغليف والتسليم',
                'title_en' => 'Packaging and delivery',
                'fields' => [
                    ['label_ar' => 'الوزن', 'label_en' => 'Gross weight', 'value_ar' => '55 كغ', 'value_en' => '55.0 kg'],
                ],
            ],
        ];

        Product::factory()->create(['slug' => 'spec-pump', 'specifications' => $specifications]);

        $response = $this->getJson('/api/v1/products/spec-pump');

        // assertEquals, not assertSame: specifications is jsonb, which does
        // not preserve object key order.
        $this->assertEquals($specifications, $response->json('data.specifications'));
    }

    /**
     * The list endpoint deliberately omits specifications — a catalogue page
     * would otherwise download every product's full spec tables.
     */
    public function test_the_list_endpoint_omits_specifications_but_the_detail_endpoint_includes_them(): void
    {
        Product::factory()->create([
            'slug' => 'listed-pump',
            'specifications' => [['title_en' => 'Key attributes', 'fields' => [['label_en' => 'Type', 'value_en' => 'Pool']]]],
        ]);

        $list = $this->getJson('/api/v1/products');
        $this->assertArrayNotHasKey('specifications', $list->json('data.0'));
        $this->assertArrayHasKey('slug', $list->json('data.0'));

        $detail = $this->getJson('/api/v1/products/listed-pump');
        $this->assertArrayHasKey('specifications', $detail->json('data'));
    }

    public function test_the_gallery_is_returned_in_order_with_the_cover_first(): void
    {
        Product::factory()->create([
            'slug' => 'gallery-pump',
            'image_url' => '/a.jpg',
            'images' => ['/a.jpg', '/b.jpg', '/c.jpg'],
        ]);

        $response = $this->getJson('/api/v1/products/gallery-pump');

        $this->assertSame(['/a.jpg', '/b.jpg', '/c.jpg'], $response->json('data.images'));
        $this->assertSame('/a.jpg', $response->json('data.image_url'));
    }
}
