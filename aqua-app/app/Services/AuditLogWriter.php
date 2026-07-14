<?php

namespace App\Services;

use App\Enums\AuditAction;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * The single place that ever writes to audit_logs. Called automatically by
 * AuditObserver for create/update/delete, and explicitly via
 * Auditable::auditAs() for actions that aren't a plain attribute diff.
 */
class AuditLogWriter
{
    public function write(Model $model, AuditAction $action, ?array $details = null, ?string $labelOverride = null): void
    {
        $actor = Auth::user();

        // No authenticated actor (console commands, seeders, jobs) means no
        // log entry — matches the existing, deliberate behavior of
        // aqua:create-admin and aqua:reset-password.
        if (! $actor) {
            return;
        }

        AuditLog::create([
            'user_id' => $actor->id,
            'user_email' => $actor->email,
            'action' => $action->value,
            'entity_type' => method_exists($model, 'auditEntityType')
                ? $model->auditEntityType()
                : Str::snake(class_basename($model)),
            'entity_id' => (string) $model->getKey(),
            'entity_label' => $labelOverride ?? (method_exists($model, 'auditLabel') ? $model->auditLabel() : null),
            'details' => $details,
        ]);
    }
}
