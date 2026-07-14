<?php

namespace Tests\Feature\Api\V1\ProductCategories;

use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListAdminProductCategoriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_all_categories_including_unpublished(): void
    {
        $admin = User::factory()->admin()->create();
        ProductCategory::factory()->create(['kind' => 'product', 'is_published' => true]);
        ProductCategory::factory()->create(['kind' => 'service', 'is_published' => false]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/product-categories');

        $response->assertStatus(200)->assertJsonCount(2, 'data');
    }

    public function test_staff_user_can_view_categories(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/product-categories')->assertStatus(200);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/product-categories')->assertStatus(401);
    }
}
