<?php

namespace Tests\Feature\Api\V1\Products;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Backs the admin edit form, which needs a product's specifications — the
 * admin *list* omits them so it isn't inflated with every product's spec
 * tables just so one of them can be edited.
 */
class ShowAdminProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_fetch_one_product_with_its_specifications(): void
    {
        $staff = User::factory()->create();
        $product = Product::factory()->create([
            'specifications' => [[
                'title_ar' => 'الخصائص',
                'title_en' => 'Key attributes',
                'fields' => [['label_ar' => 'النوع', 'label_en' => 'Type', 'value_ar' => 'مسبح', 'value_en' => 'Pool']],
            ]],
        ]);

        $response = $this->actingAs($staff, 'sanctum')->getJson("/api/v1/admin/products/{$product->id}");

        $response->assertStatus(200);
        $response->assertJsonPath('data.id', $product->id);
        $response->assertJsonPath('data.specifications.0.title_en', 'Key attributes');
    }

    /**
     * Unlike the public endpoint, the admin one must return unpublished
     * products — editing one is the whole point.
     */
    public function test_an_unpublished_product_is_returned_to_staff(): void
    {
        $staff = User::factory()->create();
        $product = Product::factory()->create(['is_published' => false]);

        $this->actingAs($staff, 'sanctum')
            ->getJson("/api/v1/admin/products/{$product->id}")
            ->assertStatus(200);
    }

    public function test_it_is_addressed_by_id_not_slug(): void
    {
        $staff = User::factory()->create();
        $product = Product::factory()->create(['slug' => 'some-slug']);

        $this->actingAs($staff, 'sanctum')
            ->getJson("/api/v1/admin/products/{$product->id}")
            ->assertStatus(200);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/products/some-slug')
            ->assertStatus(404);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $product = Product::factory()->create();

        $this->getJson("/api/v1/admin/products/{$product->id}")->assertStatus(401);
    }

    public function test_an_unknown_id_is_not_found(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/admin/products/'.fake()->uuid())
            ->assertStatus(404);
    }
}
