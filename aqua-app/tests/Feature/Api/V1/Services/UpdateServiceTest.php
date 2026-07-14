<?php

namespace Tests\Feature\Api\V1\Services;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_update_a_service(): void
    {
        $staff = User::factory()->create();
        $service = Service::factory()->create(['title_ar' => 'قديم']);

        $response = $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/services/{$service->id}", [
            'icon' => $service->icon,
            'title_ar' => 'جديد',
            'title_en' => $service->title_en,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('services', ['id' => $service->id, 'title_ar' => 'جديد']);
    }

    public function test_can_unset_a_services_category(): void
    {
        $staff = User::factory()->create();
        $service = Service::factory()->create();

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/services/{$service->id}", [
            'icon' => $service->icon,
            'title_ar' => $service->title_ar,
            'title_en' => $service->title_en,
            'category_id' => null,
        ])->assertStatus(200);

        $this->assertDatabaseHas('services', ['id' => $service->id, 'category_id' => null]);
    }

    public function test_missing_title_fails_validation(): void
    {
        $staff = User::factory()->create();
        $service = Service::factory()->create();

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/services/{$service->id}", [
            'icon' => $service->icon,
            'title_en' => 'Name',
        ])->assertStatus(422)->assertJsonValidationErrors('title_ar');
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $service = Service::factory()->create();

        $this->patchJson("/api/v1/admin/services/{$service->id}", [
            'icon' => 'droplets',
            'title_ar' => 'اسم',
            'title_en' => 'Name',
        ])->assertStatus(401);
    }
}
