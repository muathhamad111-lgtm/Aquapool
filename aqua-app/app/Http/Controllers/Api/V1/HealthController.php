<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends ApiController
{
    public function __invoke(): JsonResponse
    {
        try {
            DB::connection()->select('select 1');
            $database = 'connected';
        } catch (Throwable) {
            $database = 'unreachable';
        }

        return $this->success([
            'status' => $database === 'connected' ? 'ok' : 'degraded',
            'database' => $database,
            'timestamp' => now()->toIso8601String(),
        ], status: $database === 'connected' ? 200 : 503);
    }
}
