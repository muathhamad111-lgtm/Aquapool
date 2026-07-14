<?php

namespace Tests\Feature\Api\V1\Messages;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubmitMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_submit_a_message(): void
    {
        $response = $this->postJson('/api/v1/messages', [
            'name' => 'أحمد',
            'email' => 'ahmed@example.com',
            'message' => 'مرحباً، أرغب في استفسار عن الخدمات.',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('messages', [
            'name' => 'أحمد',
            'email' => 'ahmed@example.com',
            'status' => 'new',
        ]);
    }

    public function test_status_is_always_forced_to_new_regardless_of_input(): void
    {
        $response = $this->postJson('/api/v1/messages', [
            'name' => 'اسم',
            'email' => 'test@example.com',
            'message' => 'رسالة',
            'status' => 'archived',
        ]);

        $response->assertStatus(201);
        $this->assertSame('new', $response->json('data.status'));
    }

    public function test_missing_name_fails_validation(): void
    {
        $this->postJson('/api/v1/messages', [
            'email' => 'test@example.com',
            'message' => 'رسالة',
        ])->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_invalid_email_fails_validation(): void
    {
        $this->postJson('/api/v1/messages', [
            'name' => 'اسم',
            'email' => 'not-an-email',
            'message' => 'رسالة',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_missing_message_fails_validation(): void
    {
        $this->postJson('/api/v1/messages', [
            'name' => 'اسم',
            'email' => 'test@example.com',
        ])->assertStatus(422)->assertJsonValidationErrors('message');
    }

    public function test_message_over_4000_characters_fails_validation(): void
    {
        $this->postJson('/api/v1/messages', [
            'name' => 'اسم',
            'email' => 'test@example.com',
            'message' => str_repeat('a', 4001),
        ])->assertStatus(422)->assertJsonValidationErrors('message');
    }

    public function test_name_over_120_characters_fails_validation(): void
    {
        $this->postJson('/api/v1/messages', [
            'name' => str_repeat('a', 121),
            'email' => 'test@example.com',
            'message' => 'رسالة',
        ])->assertStatus(422)->assertJsonValidationErrors('name');
    }

    public function test_optional_fields_can_be_omitted(): void
    {
        $response = $this->postJson('/api/v1/messages', [
            'name' => 'اسم',
            'email' => 'test@example.com',
            'message' => 'رسالة',
        ]);

        $response->assertStatus(201);
        $this->assertNull($response->json('data.phone'));
        $this->assertNull($response->json('data.subject'));
    }

    public function test_submission_is_rate_limited_after_five_requests(): void
    {
        $payload = [
            'name' => 'اسم',
            'email' => 'test@example.com',
            'message' => 'رسالة',
        ];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/messages', $payload)->assertStatus(201);
        }

        $this->postJson('/api/v1/messages', $payload)->assertStatus(429);
    }

    public function test_an_unauthenticated_submission_does_not_write_an_audit_log(): void
    {
        $this->postJson('/api/v1/messages', [
            'name' => 'اسم',
            'email' => 'test@example.com',
            'message' => 'رسالة',
        ])->assertStatus(201);

        $this->assertDatabaseCount('audit_logs', 0);
    }
}
