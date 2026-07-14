<?php

namespace Tests\Feature\Api\V1\Services;

use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceSanitizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_description_is_sanitized_of_scripts_and_event_handlers_on_create(): void
    {
        $staff = User::factory()->create();
        $malicious = '<script>alert(1)</script>'
            .'<div style="text-align:justify" onclick="alert(2)">hello <b>world</b></div>'
            .'<img src=x onerror=alert(3)>';

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/services', [
            'icon' => 'droplets',
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'description_ar' => $malicious,
            'description_en' => '',
        ]);

        $response->assertStatus(201);
        $stored = Service::findOrFail($response->json('data.id'))->description_ar;
        $this->assertStringNotContainsString('<script', $stored);
        $this->assertStringNotContainsString('onclick', $stored);
        $this->assertStringNotContainsString('onerror', $stored);
        $this->assertStringNotContainsString('<img', $stored);
        $this->assertStringContainsString('<b>world</b>', $stored);
        $this->assertStringContainsString('text-align:justify', str_replace(' ', '', $stored));
    }

    public function test_description_is_sanitized_on_update(): void
    {
        $staff = User::factory()->create();
        $service = Service::factory()->create();
        $malicious = '<script>alert(1)</script>plain text';

        $this->actingAs($staff, 'sanctum')->patchJson("/api/v1/admin/services/{$service->id}", [
            'icon' => $service->icon,
            'title_ar' => $service->title_ar,
            'title_en' => $service->title_en,
            'description_ar' => $malicious,
        ])->assertStatus(200);

        $stored = $service->fresh()->description_ar;
        $this->assertStringNotContainsString('<script', $stored);
        $this->assertStringContainsString('plain text', $stored);
    }

    public function test_javascript_url_is_stripped(): void
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/services', [
            'icon' => 'droplets',
            'title_ar' => 'اسم',
            'title_en' => 'Name',
            'description_ar' => '<p><a href="javascript:alert(1)">click</a></p>',
        ]);

        $response->assertStatus(201);
        $stored = Service::findOrFail($response->json('data.id'))->description_ar;
        $this->assertStringNotContainsString('javascript:', $stored);
    }
}
