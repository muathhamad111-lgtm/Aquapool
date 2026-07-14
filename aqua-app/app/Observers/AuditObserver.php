<?php

namespace App\Observers;

use App\Enums\AuditAction;
use App\Services\AuditLogWriter;
use Illuminate\Database\Eloquent\Model;

/**
 * Attached automatically to every model using the Auditable trait. Turns
 * plain Eloquent create/update/delete lifecycle events into audit log
 * entries — no per-model or per-controller wiring needed.
 */
class AuditObserver
{
    public function __construct(private readonly AuditLogWriter $writer) {}

    public function created(Model $model): void
    {
        $this->writer->write($model, AuditAction::Create);
    }

    public function updated(Model $model): void
    {
        $changes = $this->diff($model);

        if ($changes === []) {
            return;
        }

        $this->writer->write($model, AuditAction::Update, ['changes' => $changes]);
    }

    public function deleted(Model $model): void
    {
        $this->writer->write($model, AuditAction::Delete);
    }

    /**
     * @return array<string, array{0: mixed, 1: mixed}|array{redacted: true}>
     */
    private function diff(Model $model): array
    {
        $ignore = method_exists($model, 'auditIgnore') ? $model->auditIgnore() : [];
        $redact = method_exists($model, 'auditRedact') ? $model->auditRedact() : [];

        $changes = [];

        foreach ($model->getChanges() as $key => $new) {
            if (in_array($key, $ignore, true)) {
                continue;
            }

            if (in_array($key, $redact, true)) {
                $changes[$key] = ['redacted' => true];

                continue;
            }

            $changes[$key] = [$model->getOriginal($key), $new];
        }

        return $changes;
    }
}
