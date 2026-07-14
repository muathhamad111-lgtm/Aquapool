<?php

namespace App\Enums;

/**
 * The closed set of actions an audit log entry can record. New actions must
 * be added here rather than passed as free-form strings, so entity_type/action
 * combinations stay consistent across every module.
 */
enum AuditAction: string
{
    case Create = 'create';
    case Update = 'update';
    case Delete = 'delete';

    /**
     * For state transitions that aren't a plain attribute diff (e.g. a
     * message's status). Written via Auditable::auditAs(), not automatically.
     */
    case StatusChange = 'status_change';
}
