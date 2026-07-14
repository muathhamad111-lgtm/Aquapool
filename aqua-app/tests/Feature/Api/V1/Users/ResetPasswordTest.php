<?php

namespace Tests\Feature\Api\V1\Users;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResetPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_reset_a_staff_users_password(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/users/{$staff->id}/password", ['password' => 'new-password-123']);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('new-password-123', $staff->fresh()->password));
    }

    public function test_admin_can_reset_another_admins_password(): void
    {
        $admin = User::factory()->admin()->create();
        $otherAdmin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/users/{$otherAdmin->id}/password", ['password' => 'new-password-123']);

        $response->assertStatus(200);
    }

    public function test_staff_user_can_reset_another_staff_users_password(): void
    {
        $staff = User::factory()->create();
        $otherStaff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/v1/admin/users/{$otherStaff->id}/password", ['password' => 'new-password-123']);

        $response->assertStatus(200);
    }

    public function test_staff_user_cannot_reset_an_admins_password(): void
    {
        $staff = User::factory()->create();
        $admin = User::factory()->admin()->create();
        $originalPassword = $admin->password;

        $response = $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/v1/admin/users/{$admin->id}/password", ['password' => 'new-password-123']);

        $response->assertStatus(403)->assertExactJson(['message' => 'This action is unauthorized.']);
        $this->assertSame($originalPassword, $admin->fresh()->password);
    }

    public function test_short_password_fails_validation(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->create();

        $response = $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/users/{$staff->id}/password", ['password' => 'short']);

        $response->assertStatus(422)->assertJsonValidationErrors(['password']);
    }
}
