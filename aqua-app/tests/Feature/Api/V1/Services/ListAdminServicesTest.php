<?php

namespace Tests\Feature\Api\V1\Services;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListAdminServicesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_all_services_including_unpublished(): void
    {
        $admin = User::factory()->admin()->create();
        Service::factory()->create(['is_published' => true]);
        Service::factory()->create(['is_published' => false]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/admin/services');

        $response->assertStatus(200)->assertJsonCount(2, 'data');
    }

    public function test_staff_user_can_view_services(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->getJson('/api/v1/admin/services')->assertStatus(200);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/admin/services')->assertStatus(401);
    }
}
