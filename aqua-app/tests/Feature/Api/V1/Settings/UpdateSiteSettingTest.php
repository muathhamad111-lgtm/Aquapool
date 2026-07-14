<?php

namespace Tests\Feature\Api\V1\Settings;

use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateSiteSettingTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_hero(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/settings/hero', [
            'value' => [
                'title_ar' => 'عنوان جديد',
                'title_en' => 'New Title',
                'subtitle_ar' => 'وصف',
                'subtitle_en' => 'Subtitle',
                'cta_label_ar' => 'اطلب الآن',
                'cta_label_en' => 'Order now',
            ],
        ]);

        $response->assertStatus(200)->assertJson(['data' => ['title_en' => 'New Title']]);
        $this->assertDatabaseHas('site_settings', ['key' => 'hero']);
    }

    public function test_staff_user_can_update_settings(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->putJson('/api/v1/admin/settings/contact', [
            'value' => ['phone' => '+966500000000', 'email' => 'info@example.com'],
        ])->assertStatus(200);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->putJson('/api/v1/admin/settings/hero', ['value' => []])->assertStatus(401);
    }

    public function test_unknown_key_returns_not_found(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/admin/settings/does-not-exist', ['value' => []])
            ->assertStatus(404);
    }

    public function test_invalid_contact_email_fails_validation(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')
            ->putJson('/api/v1/admin/settings/contact', ['value' => ['email' => 'not-an-email']])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['value.email']);
    }

    public function test_values_item_requires_a_known_icon(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/settings/values', [
            'value' => [
                'items' => [
                    ['icon' => 'NotARealIcon', 'title_ar' => 'أ', 'title_en' => 'A', 'desc_ar' => 'وصف', 'desc_en' => 'Desc'],
                ],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors(['value.items.0.icon']);
    }

    public function test_values_item_requires_title_and_description(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/settings/values', [
            'value' => ['items' => [['icon' => 'Star']]],
        ])->assertStatus(422)->assertJsonValidationErrors([
            'value.items.0.title_ar', 'value.items.0.title_en',
            'value.items.0.desc_ar', 'value.items.0.desc_en',
        ]);
    }

    public function test_about_rich_text_is_sanitized_of_scripts_and_event_handlers(): void
    {
        $admin = User::factory()->admin()->create();

        $malicious = '<script>alert(1)</script>'
            .'<div style="text-align:justify" onclick="alert(2)">hello <b>world</b></div>'
            .'<img src=x onerror=alert(3)>';

        $response = $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/settings/about', [
            'value' => [
                'story_ar' => $malicious,
                'story_en' => '', 'mission_ar' => '', 'mission_en' => '', 'vision_ar' => '', 'vision_en' => '',
            ],
        ]);

        $response->assertStatus(200);

        $stored = SiteSetting::find('about')->value['story_ar'];

        $this->assertStringNotContainsString('<script', $stored);
        $this->assertStringNotContainsString('onclick', $stored);
        $this->assertStringNotContainsString('onerror', $stored);
        $this->assertStringNotContainsString('<img', $stored);
        // The legitimate formatting must survive sanitization, not just the dangerous parts get stripped.
        $this->assertStringContainsString('<b>world</b>', $stored);
        $this->assertStringContainsString('text-align:justify', str_replace(' ', '', $stored));
    }

    public function test_about_rich_text_strips_javascript_url(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/settings/about', [
            'value' => [
                'story_ar' => '<a href="javascript:alert(1)">click</a>',
                'story_en' => '', 'mission_ar' => '', 'mission_en' => '', 'vision_ar' => '', 'vision_en' => '',
            ],
        ]);

        $response->assertStatus(200);

        $stored = SiteSetting::find('about')->value['story_ar'];

        $this->assertStringNotContainsString('javascript:', $stored);
    }
}
