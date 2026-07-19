<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_credentials_return_a_token_and_the_user(): void
    {
        $user = User::factory()->create(['password' => 'correct-password']);

        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => $user->email,
            'password' => 'correct-password',
        ]);

        $response->assertStatus(200)->assertJsonStructure([
            'data' => ['token', 'user' => ['id', 'email', 'role']],
        ]);
    }

    public function test_invalid_password_is_rejected(): void
    {
        $user = User::factory()->create(['password' => 'correct-password']);

        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422)->assertJsonStructure(['message', 'errors']);
    }

    public function test_unknown_email_is_rejected(): void
    {
        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => 'nobody@example.com',
            'password' => 'whatever123',
        ]);

        $response->assertStatus(422);
    }

    public function test_missing_fields_fail_validation(): void
    {
        $response = $this->postJson('/api/v1/admin/auth/login', []);

        $response->assertStatus(422)->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_repeated_failed_attempts_are_rate_limited(): void
    {
        $user = User::factory()->create(['password' => 'correct-password']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/admin/auth/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ])->assertStatus(422);
        }

        $this->postJson('/api/v1/admin/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }

    /**
     * The limiter must not lock a whole office out over one colleague's
     * typos: attempts are keyed by email + IP, not IP alone.
     */
    public function test_throttling_one_account_does_not_block_another_account(): void
    {
        $victim = User::factory()->create(['password' => 'correct-password']);
        $other = User::factory()->create(['password' => 'other-password']);

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/v1/admin/auth/login', [
                'email' => $victim->email,
                'password' => 'wrong-password',
            ]);
        }

        $this->postJson('/api/v1/admin/auth/login', [
            'email' => $other->email,
            'password' => 'other-password',
        ])->assertStatus(200);
    }

    public function test_the_email_key_is_case_insensitive(): void
    {
        $user = User::factory()->create(['email' => 'admin@example.com', 'password' => 'correct-password']);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/admin/auth/login', [
                'email' => 'admin@example.com',
                'password' => 'wrong-password',
            ])->assertStatus(422);
        }

        // Same account, different casing — must not reset the attempt counter.
        $this->postJson('/api/v1/admin/auth/login', [
            'email' => 'ADMIN@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }
}
