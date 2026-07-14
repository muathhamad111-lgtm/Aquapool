<?php

namespace Tests\Feature\Api\V1\Services;

use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_create_a_service(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/services', [
            'icon' => 'droplets',
            'title_ar' => 'خدمة جديدة',
            'title_en' => 'New Service',
            'description_ar' => 'وصف الخدمة',
            'description_en' => 'Service description',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('services', [
            'title_ar' => 'خدمة جديدة',
            'icon' => 'droplets',
        ]);
    }

    public function test_can_create_a_service_with_a_category(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'service']);

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/services', [
            'icon' => 'gem',
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'category_id' => $category->id,
        ]);

        $response->assertStatus(201);
        $this->assertSame($category->id, $response->json('data.category_id'));
    }

    public function test_invalid_icon_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/services', [
            'icon' => 'bogus-icon',
            'title_ar' => 'اسم',
            'title_en' => 'Name',
        ])->assertStatus(422)->assertJsonValidationErrors('icon');
    }

    public function test_missing_title_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/services', [
            'icon' => 'droplets',
            'title_en' => 'Name',
        ])->assertStatus(422)->assertJsonValidationErrors('title_ar');
    }

    public function test_nonexistent_category_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/services', [
            'icon' => 'droplets',
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'category_id' => '00000000-0000-0000-0000-000000000000',
        ])->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/services', [
            'icon' => 'droplets',
            'title_ar' => 'اسم',
            'title_en' => 'Name',
        ])->assertStatus(401);
    }
}
