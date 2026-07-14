<?php

namespace Tests\Feature\Api\V1\Projects;

use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateProjectTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_create_a_project(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/projects', [
            'title_ar' => 'مشروع جديد',
            'title_en' => 'New Project',
            'location_ar' => 'الرياض',
            'location_en' => 'Riyadh',
            'year' => '2026',
            'is_featured' => true,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('projects', [
            'title_ar' => 'مشروع جديد',
            'is_featured' => true,
        ]);
    }

    public function test_category_id_is_optional(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/projects', [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
        ]);

        $response->assertStatus(201);
        $this->assertNull($response->json('data.category_id'));
    }

    public function test_can_create_a_project_with_a_category(): void
    {
        $staff = User::factory()->create();
        $category = ProductCategory::factory()->create(['kind' => 'project']);

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/projects', [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'category_id' => $category->id,
        ]);

        $response->assertStatus(201);
        $this->assertSame($category->id, $response->json('data.category_id'));
    }

    public function test_nonexistent_category_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/projects', [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'category_id' => '00000000-0000-0000-0000-000000000000',
        ])->assertStatus(422)->assertJsonValidationErrors('category_id');
    }

    public function test_missing_title_fails_validation(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/projects', [
            'title_en' => 'Name',
        ])->assertStatus(422)->assertJsonValidationErrors('title_ar');
    }

    public function test_a_relative_placeholder_path_is_accepted_for_image_url(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/projects', [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'image_url' => '/site/placeholder.jpg',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('projects', ['image_url' => '/site/placeholder.jpg']);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->postJson('/api/v1/admin/projects', [
            'title_ar' => 'اسم',
            'title_en' => 'Name',
        ])->assertStatus(401);
    }
}
