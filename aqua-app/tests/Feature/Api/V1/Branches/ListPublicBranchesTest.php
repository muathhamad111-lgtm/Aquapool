<?php

namespace Tests\Feature\Api\V1\Branches;

use App\Models\Branch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListPublicBranchesTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_branches_are_returned_without_auth(): void
    {
        Branch::factory()->count(3)->create();

        $response = $this->getJson('/api/v1/branches');

        $response->assertStatus(200)->assertJsonCount(3, 'data');
        $response->assertJsonStructure([
            'data' => [[
                'id', 'name_ar', 'name_en',
                'country_ar', 'country_en', 'region_ar', 'region_en',
                'district_ar', 'district_en', 'street_ar', 'street_en',
                'email', 'phone', 'hours_ar', 'hours_en',
                'sort_order', 'is_published',
            ]],
        ]);
    }

    public function test_unpublished_branches_are_hidden(): void
    {
        Branch::factory()->create(['name_ar' => 'ظاهر']);
        Branch::factory()->unpublished()->create(['name_ar' => 'مخفي']);

        $response = $this->getJson('/api/v1/branches');

        $response->assertStatus(200)->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.name_ar', 'ظاهر');
    }

    /**
     * The footer shows one branch and takes the first of this list, so the
     * order is a contract, not a convenience.
     */
    public function test_branches_are_ordered_by_sort_order(): void
    {
        Branch::factory()->create(['name_ar' => 'ثالث', 'sort_order' => 3]);
        Branch::factory()->create(['name_ar' => 'أول', 'sort_order' => 1]);
        Branch::factory()->create(['name_ar' => 'ثاني', 'sort_order' => 2]);

        $response = $this->getJson('/api/v1/branches');

        $this->assertSame(
            ['أول', 'ثاني', 'ثالث'],
            array_column($response->json('data'), 'name_ar'),
        );
    }

    public function test_an_empty_list_is_returned_when_there_are_no_branches(): void
    {
        $this->getJson('/api/v1/branches')->assertStatus(200)->assertExactJson(['data' => []]);
    }
}
