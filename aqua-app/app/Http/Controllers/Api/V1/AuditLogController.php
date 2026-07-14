<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\V1\AuditLogResource;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        $logs = AuditLog::orderByDesc('created_at')->limit(500)->get();

        return $this->success(AuditLogResource::collection($logs));
    }
}
