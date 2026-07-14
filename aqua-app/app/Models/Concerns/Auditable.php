<?php

namespace App\Models\Concerns;

use App\Enums\AuditAction;
use App\Observers\AuditObserver;
use App\Services\AuditLogWriter;
use Illuminate\Support\Str;

/**
 * Gives a model automatic audit logging: create/update/delete are recorded
 * by AuditObserver with zero controller or Domain Service code. A new
 * module adopts this by adding `use Auditable;` and, if the defaults don't
 * fit, overriding auditLabel()/auditIgnore()/auditRedact() below.
 */
trait Auditable
{
    protected static function bootAuditable(): void
    {
        static::observe(AuditObserver::class);
    }

    /**
     * The entity_type recorded on audit_logs. Defaults to the snake_case
     * class name (e.g. ProductCategory -> product_category).
     */
    public function auditEntityType(): string
    {
        return Str::snake(class_basename($this));
    }

    /**
     * The human-readable entity_label recorded on audit_logs. Override this
     * when the default attribute guesses aren't right for a model.
     */
    public function auditLabel(): ?string
    {
        foreach (['title_ar', 'title_en', 'name_ar', 'name', 'email', 'label'] as $attribute) {
            if (! empty($this->{$attribute})) {
                return (string) $this->{$attribute};
            }
        }

        return null;
    }

    /**
     * Attributes that never count as a change at all — not even a redacted
     * marker. Override to add model-specific noisy/internal columns.
     */
    public function auditIgnore(): array
    {
        return ['updated_at', 'remember_token'];
    }

    /**
     * Attributes that do count as a change, but whose values must never be
     * written to audit_logs (e.g. passwords). Recorded as {"redacted": true}.
     */
    public function auditRedact(): array
    {
        return [];
    }

    /**
     * Escape hatch for actions that aren't a plain attribute diff (e.g. a
     * message's status transition). Still funnels through the same writer
     * used by the automatic create/update/delete path.
     */
    public function auditAs(AuditAction $action, ?array $details = null, ?string $labelOverride = null): void
    {
        app(AuditLogWriter::class)->write($this, $action, $details, $labelOverride);
    }
}
