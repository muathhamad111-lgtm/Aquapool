<?php

namespace Tests\Feature\Api\V1\Services;

use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListPublicServicesTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_only_published_services_ordered_by_sort_order(): void
    {
        Service::factory()->create(['title_ar' => 'B', 'is_published' => true, 'sort_order' => 2]);
        Service::factory()->create(['title_ar' => 'A', 'is_published' => true, 'sort_order' => 1]);
        Service::factory()->create(['title_ar' => 'Hidden', 'is_published' => false, 'sort_order' => 0]);

        $response = $this->getJson('/api/v1/services');

        $response->assertStatus(200)->assertJsonCount(2, 'data');
        $this->assertSame('A', $response->json('data.0.title_ar'));
        $this->assertSame('B', $response->json('data.1.title_ar'));
    }

    public function test_no_auth_required(): void
    {
        $this->getJson('/api/v1/services')->assertStatus(200);
    }
}
