<?php

namespace Tests\Feature\Api\V1\AuditLogs;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_user_writes_an_audit_log(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/users', [
            'email' => 'newstaff@example.com',
            'password' => 'password123',
            'role' => 'user',
        ])->assertStatus(201);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'user_email' => $admin->email,
            'action' => 'create',
            'entity_type' => 'user',
            'entity_label' => 'newstaff@example.com',
        ]);
    }

    public function test_deleting_a_user_writes_an_audit_log(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$target->id}")
            ->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'delete',
            'entity_type' => 'user',
            'entity_id' => (string) $target->id,
            'entity_label' => $target->email,
        ]);
    }

    public function test_resetting_a_password_writes_an_audit_log_without_leaking_the_password(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/v1/admin/users/{$target->id}/password", ['password' => 'new-password-123'])
            ->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'update',
            'entity_type' => 'user',
            'entity_id' => (string) $target->id,
            'entity_label' => $target->email,
        ]);

        $log = AuditLog::where('entity_id', (string) $target->id)->where('action', 'update')->firstOrFail();

        // The change is recorded, but the value is redacted — never the
        // plaintext password, never the bcrypt hash, in either direction.
        $this->assertSame(['password' => ['redacted' => true]], $log->details['changes']);
        $encoded = json_encode($log->details);
        $this->assertStringNotContainsString('new-password-123', $encoded);
        $this->assertStringNotContainsString($target->fresh()->password, $encoded);
    }

    public function test_updating_a_plain_attribute_writes_an_audit_log_with_a_diff(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create(['name' => 'Old Name']);

        $this->actingAs($admin, 'sanctum');
        $target->update(['name' => 'New Name']);

        $log = AuditLog::where('entity_id', (string) $target->id)->where('action', 'update')->firstOrFail();
        $this->assertSame(['name' => ['Old Name', 'New Name']], $log->details['changes']);
    }

    public function test_updating_only_an_ignored_attribute_does_not_write_an_audit_log(): void
    {
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $this->actingAs($admin, 'sanctum');
        $target->forceFill(['last_login_at' => now()])->save();

        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_changes_without_an_authenticated_actor_do_not_write_an_audit_log(): void
    {
        // No actingAs() — simulates a console command / seeder context, e.g.
        // aqua:create-admin or aqua:reset-password.
        $user = User::factory()->create();
        $user->update(['name' => 'Changed From Console']);
        $user->delete();

        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_auditas_escape_hatch_writes_a_custom_action_with_an_authenticated_actor(): void
    {
        // No real module uses this yet (it exists for a future status_change
        // action, e.g. Messages) — this proves the mechanism itself works
        // before anything depends on it.
        $admin = User::factory()->admin()->create();
        $target = User::factory()->create();

        $this->actingAs($admin, 'sanctum');
        $target->auditAs(AuditAction::StatusChange, ['from' => 'pending', 'to' => 'done']);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'user_email' => $admin->email,
            'action' => 'status_change',
            'entity_type' => 'user',
            'entity_id' => (string) $target->id,
            'entity_label' => $target->email,
        ]);

        $log = AuditLog::where('entity_id', (string) $target->id)->where('action', 'status_change')->firstOrFail();
        // assertEquals, not assertSame: `details` is jsonb in PostgreSQL,
        // which normalizes key order (shortest key first), so the round-trip
        // returns ['to' => ..., 'from' => ...]. Key order in a JSON object
        // carries no meaning — only the mapping does.
        $this->assertEquals(['from' => 'pending', 'to' => 'done'], $log->details);
    }

    public function test_auditas_escape_hatch_without_an_authenticated_actor_does_not_write_an_audit_log(): void
    {
        $target = User::factory()->create();

        $target->auditAs(AuditAction::StatusChange, ['from' => 'pending', 'to' => 'done']);

        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_a_denied_action_does_not_write_an_audit_log(): void
    {
        $staff = User::factory()->create();
        $admin = User::factory()->admin()->create();

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$admin->id}")
            ->assertStatus(403);

        $this->assertDatabaseCount('audit_logs', 0);
    }
}
