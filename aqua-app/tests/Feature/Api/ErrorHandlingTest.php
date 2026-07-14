<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class ErrorHandlingTest extends TestCase
{
    public function test_unknown_api_route_returns_normalized_not_found_envelope(): void
    {
        $response = $this->getJson('/api/v1/this-route-does-not-exist');

        $response->assertStatus(404)->assertExactJson([
            'message' => 'Resource not found.',
        ]);
    }

    /**
     * Regression test: a guest request with no Accept header (i.e. not sent
     * through getJson()/postJson(), which set Accept: application/json
     * automatically) must still get a clean 401, not crash trying to
     * redirect to a web login route that doesn't exist in this API-only app.
     */
    public function test_unauthenticated_request_without_accept_header_still_returns_clean_401(): void
    {
        $response = $this->get('/api/v1/admin/auth/me');

        $response->assertStatus(401)->assertExactJson(['message' => 'Unauthenticated.']);
    }

    /**
     * Regression test: the catch-all handler must not mask an exception's
     * real HTTP status (e.g. 405 Method Not Allowed) as a generic 500. This
     * only reproduces with APP_DEBUG=false, which is why it wasn't caught
     * until building the audit-logs endpoint (local dev runs with debug on).
     */
    public function test_method_not_allowed_keeps_its_real_status_when_debug_is_off(): void
    {
        config(['app.debug' => false]);

        $response = $this->postJson('/api/v1/admin/audit-logs', []);

        $response->assertStatus(405);
    }
}
