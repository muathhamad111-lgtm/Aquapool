<?php

namespace Tests\Feature\Api\V1\Uploads;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StoreImageUploadTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');
    }

    public function test_staff_can_upload_a_product_image(): void
    {
        $staff = User::factory()->create();
        $file = UploadedFile::fake()->image('photo.jpg');

        $response = $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/uploads', [
            'file' => $file,
            'folder' => 'products',
        ]);

        $response->assertStatus(201);
        $url = $response->json('data.url');
        $this->assertStringContainsString('/storage/products/', $url);
        $this->assertStringEndsWith('.jpg', $url);

        // The filename is server-generated (a UUID), never the original name.
        $this->assertStringNotContainsString('photo', $url);

        $path = 'products/'.basename(parse_url($url, PHP_URL_PATH));
        Storage::disk('public')->assertExists($path);
    }

    public function test_admin_can_upload_a_project_image(): void
    {
        $admin = User::factory()->admin()->create();
        $file = UploadedFile::fake()->image('site.png');

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/admin/uploads', [
            'file' => $file,
            'folder' => 'projects',
        ]);

        $response->assertStatus(201);
        $this->assertStringContainsString('/storage/projects/', $response->json('data.url'));
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $file = UploadedFile::fake()->image('photo.jpg');

        $this->postJson('/api/v1/admin/uploads', [
            'file' => $file,
            'folder' => 'products',
        ])->assertStatus(401);
    }

    public function test_an_unlisted_folder_is_rejected(): void
    {
        $staff = User::factory()->create();
        $file = UploadedFile::fake()->image('photo.jpg');

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/uploads', [
            'file' => $file,
            'folder' => 'services',
        ])->assertStatus(422)->assertJsonValidationErrors('folder');
    }

    public function test_a_non_image_file_is_rejected(): void
    {
        $staff = User::factory()->create();
        $file = UploadedFile::fake()->create('script.php', 10);

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/uploads', [
            'file' => $file,
            'folder' => 'products',
        ])->assertStatus(422)->assertJsonValidationErrors('file');
    }

    public function test_a_file_over_5mb_is_rejected(): void
    {
        $staff = User::factory()->create();
        $file = UploadedFile::fake()->image('big.jpg')->size(5121);

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/uploads', [
            'file' => $file,
            'folder' => 'products',
        ])->assertStatus(422)->assertJsonValidationErrors('file');
    }

    public function test_a_missing_file_is_rejected(): void
    {
        $staff = User::factory()->create();

        $this->actingAs($staff, 'sanctum')->postJson('/api/v1/admin/uploads', [
            'folder' => 'products',
        ])->assertStatus(422)->assertJsonValidationErrors('file');
    }
}
