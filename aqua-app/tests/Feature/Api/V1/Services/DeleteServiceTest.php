<?php

namespace Tests\Feature\Api\V1\Services;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_delete_a_service(): void
    {
        $staff = User::factory()->create();
        $service = Service::factory()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/services/{$service->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('services', ['id' => $service->id]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $service = Service::factory()->create();

        $this->deleteJson("/api/v1/admin/services/{$service->id}")->assertStatus(401);
        $this->assertDatabaseHas('services', ['id' => $service->id]);
    }
}
