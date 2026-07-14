<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_logout_and_the_token_is_revoked(): void
    {
        $user = User::factory()->create();
        $plainTextToken = $user->createToken('test')->plainTextToken;
        $tokenId = (int) explode('|', $plainTextToken)[0];

        $response = $this->withHeader('Authorization', "Bearer {$plainTextToken}")
            ->postJson('/api/v1/admin/auth/logout');

        $response->assertStatus(200);

        // Assert the token row itself is gone, rather than making a second
        // in-test HTTP call: PHPUnit reuses one booted app across calls in
        // the same test, and Illuminate\Auth\RequestGuard caches the
        // resolved user per guard instance — a second call here would read
        // that stale cache rather than re-resolving, unlike a real request.
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $tokenId]);
    }

    public function test_unauthenticated_logout_is_rejected(): void
    {
        $response = $this->postJson('/api/v1/admin/auth/logout');

        $response->assertStatus(401)->assertExactJson(['message' => 'Unauthenticated.']);
    }
}
