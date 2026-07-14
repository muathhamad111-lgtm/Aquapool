<?php

namespace Tests\Feature\Console;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreateAdminCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_the_first_admin(): void
    {
        $this->artisan('aqua:create-admin', [
            'email' => 'admin@example.com',
            '--password' => 'password123',
        ])->assertExitCode(0);

        $this->assertDatabaseHas('users', ['email' => 'admin@example.com', 'role' => 'admin']);
    }

    public function test_it_refuses_a_second_admin_without_force(): void
    {
        User::factory()->admin()->create();

        $this->artisan('aqua:create-admin', [
            'email' => 'second-admin@example.com',
            '--password' => 'password123',
        ])->assertExitCode(1);

        $this->assertDatabaseMissing('users', ['email' => 'second-admin@example.com']);
    }

    public function test_it_allows_a_second_admin_with_force(): void
    {
        User::factory()->admin()->create();

        $this->artisan('aqua:create-admin', [
            'email' => 'second-admin@example.com',
            '--password' => 'password123',
            '--force' => true,
        ])->assertExitCode(0);

        $this->assertDatabaseHas('users', ['email' => 'second-admin@example.com', 'role' => 'admin']);
    }

    public function test_it_rejects_a_duplicate_email(): void
    {
        $existing = User::factory()->create();

        $this->artisan('aqua:create-admin', [
            'email' => $existing->email,
            '--password' => 'password123',
        ])->assertExitCode(1);
    }

    public function test_it_rejects_a_short_password(): void
    {
        $this->artisan('aqua:create-admin', [
            'email' => 'admin@example.com',
            '--password' => 'short',
        ])->assertExitCode(1);

        $this->assertDatabaseMissing('users', ['email' => 'admin@example.com']);
    }
}
