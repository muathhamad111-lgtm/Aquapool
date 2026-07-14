<?php

namespace Tests\Feature\Api\V1\Products;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteProductTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_delete_a_product(): void
    {
        $staff = User::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/products/{$product->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $product = Product::factory()->create();

        $this->deleteJson("/api/v1/admin/products/{$product->id}")->assertStatus(401);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }
}
