<?php

namespace Tests\Feature\Api\V1\Settings;

use App\Models\SiteSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_are_readable_without_authentication(): void
    {
        SiteSetting::create(['key' => 'hero', 'value' => ['title_ar' => 'مرحبا', 'title_en' => 'Hello']]);
        SiteSetting::create(['key' => 'contact', 'value' => ['email' => 'info@example.com']]);

        $response = $this->getJson('/api/v1/settings');

        $response->assertStatus(200)->assertJson([
            'data' => [
                'hero' => ['title_ar' => 'مرحبا', 'title_en' => 'Hello'],
                'contact' => ['email' => 'info@example.com'],
            ],
        ]);
    }

    public function test_returns_an_empty_object_when_no_settings_exist_yet(): void
    {
        $response = $this->getJson('/api/v1/settings');

        $response->assertStatus(200)->assertExactJson(['data' => []]);
    }
}
