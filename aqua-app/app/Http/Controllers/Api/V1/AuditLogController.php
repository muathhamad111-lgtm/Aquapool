<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\AuditLogs\IndexAuditLogRequest;
use App\Http\Resources\V1\AuditLogResource;
use App\Models\AuditLog;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;

class AuditLogController extends ApiController
{
    public function __construct(private readonly AuditLogService $auditLogs) {}

    public function index(IndexAuditLogRequest $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        return $this->paginated(
            $this->auditLogs->paginate($request->validated()),
            AuditLogResource::class,
            ['entity_counts' => $this->auditLogs->entityCounts()],
        );
    }
}
