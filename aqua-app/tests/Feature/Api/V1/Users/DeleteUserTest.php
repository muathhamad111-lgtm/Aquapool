<?php

namespace Tests\Feature\Api\V1\Users;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeleteUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_delete_another_user(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/users/{$target->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->deleteJson("/api/v1/admin/users/{$admin->id}");

        $response->assertStatus(403)->assertExactJson(['message' => 'This action is unauthorized.']);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_staff_user_cannot_delete_anyone(): void
    {
        $staff = User::factory()->create();
        $target = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->deleteJson("/api/v1/admin/users/{$target->id}");

        $response->assertStatus(403)->assertExactJson(['message' => 'This action is unauthorized.']);
        $this->assertDatabaseHas('users', ['id' => $target->id]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $target = User::factory()->create();

        $response = $this->deleteJson("/api/v1/admin/users/{$target->id}");

        $response->assertStatus(401);
    }
}
