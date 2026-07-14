<?php

namespace Tests\Feature\Console;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ResetPasswordCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_resets_an_existing_users_password(): void
    {
        $user = User::factory()->create();

        $this->artisan('aqua:reset-password', [
            'email' => $user->email,
            '--password' => 'brand-new-password-123',
        ])->assertExitCode(0);

        $this->assertTrue(Hash::check('brand-new-password-123', $user->fresh()->password));
    }

    public function test_it_rejects_an_unknown_email(): void
    {
        $this->artisan('aqua:reset-password', [
            'email' => 'nobody@example.com',
            '--password' => 'brand-new-password-123',
        ])->assertExitCode(1);
    }

    public function test_it_rejects_a_short_password(): void
    {
        $user = User::factory()->create();
        $originalPassword = $user->password;

        $this->artisan('aqua:reset-password', [
            'email' => $user->email,
            '--password' => 'short',
        ])->assertExitCode(1);

        $this->assertSame($originalPassword, $user->fresh()->password);
    }
}
