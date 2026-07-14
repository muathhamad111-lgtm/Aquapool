<?php

namespace App\Models;

use App\Models\Concerns\Auditable;
use Database\Factories\MessageFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    /** @use HasFactory<MessageFactory> */
    use Auditable, HasFactory, HasUuids;

    // Matches the original Supabase schema exactly: created_at only, no
    // updated_at column exists.
    const UPDATED_AT = null;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'city',
        'project_type',
        'budget',
        'timeline',
        'subject',
        'message',
        'status',
    ];

    /**
     * Combined label matching the exact format the frontend's manual
     * recordAudit() calls used before migration — overrides the trait's
     * default single-attribute fallback (which would return only `name`).
     */
    public function auditLabel(): ?string
    {
        return "{$this->name} — {$this->email}";
    }

    /**
     * `status` is deliberately excluded from the automatic update-diff:
     * every status transition goes through auditAs(AuditAction::StatusChange)
     * instead (see MessageService), so the plain observer-driven `update`
     * log would otherwise duplicate it as a second, redundant entry.
     */
    public function auditIgnore(): array
    {
        return ['updated_at', 'remember_token', 'status'];
    }
}
