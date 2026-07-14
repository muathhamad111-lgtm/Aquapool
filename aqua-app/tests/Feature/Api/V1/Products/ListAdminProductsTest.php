<?php

namespace Tests\Feature\Api\V1\Products;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListAdminProductsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_all_products_including_unpublished(): void
    {
        $admin = User::factory()->admin()->create();
        Product::factory()->create(['is_published' => true]);
        Product::factory()->create(['is_published' => false]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/products');

        $response->assertStatus(200)->assertJsonCount(2, 'data');
    }

    public function test_staff_user_can_view_products(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/products')->assertStatus(200);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/products')->assertStatus(401);
    }
}
