<?php

namespace Tests\Feature\Api\V1\Users;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_a_staff_user(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/users', [
            'email' => 'staff@example.com',
            'password' => 'password123',
            'role' => 'user',
        ]);

        $response->assertStatus(201)->assertJson(['data' => ['role' => 'user']]);
        $this->assertDatabaseHas('users', ['email' => 'staff@example.com', 'role' => 'user']);
    }

    public function test_admin_can_create_another_admin(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/users', [
            'email' => 'newadmin@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $response->assertStatus(201)->assertJson(['data' => ['role' => 'admin']]);
    }

    public function test_staff_user_can_create_a_staff_user(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/users', [
            'email' => 'anotherstaff@example.com',
            'password' => 'password123',
            'role' => 'user',
        ]);

        $response->assertStatus(201);
    }

    public function test_staff_user_cannot_create_an_admin(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/users', [
            'email' => 'shouldfail@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $response->assertStatus(403)->assertExactJson(['message' => 'This action is unauthorized.']);
        $this->assertDatabaseMissing('users', ['email' => 'shouldfail@example.com']);
    }

    public function test_duplicate_email_fails_validation(): void
    {
        $admin = User::factory()->admin()->create();
        $existing = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/users', [
            'email' => $existing->email,
            'password' => 'password123',
            'role' => 'user',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_short_password_fails_validation(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/users', [
            'email' => 'short@example.com',
            'password' => 'short',
            'role' => 'user',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['password']);
    }
}
