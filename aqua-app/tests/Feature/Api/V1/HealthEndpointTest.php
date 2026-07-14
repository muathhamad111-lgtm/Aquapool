<?php

namespace Tests\Feature\Api\V1;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    public function test_health_endpoint_reports_ok_when_database_is_reachable(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)->assertJson([
            'data' => [
                'status' => 'ok',
                'database' => 'connected',
            ],
        ]);

        $response->assertJsonStructure([
            'data' => ['status', 'database', 'timestamp'],
        ]);
    }
}
