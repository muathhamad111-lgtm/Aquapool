<?php

namespace App\Enums;

/**
 * The closed set of states a contact-form message can be in. Mirrors the
 * `AuditAction` pattern: one definition, referenced everywhere, so the
 * status list can never drift between a validation rule, a summary
 * payload, and the admin UI's filters.
 */
enum MessageStatus: string
{
    case New = 'new';
    case InProgress = 'in_progress';
    case Replied = 'replied';
    case Archived = 'archived';

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
