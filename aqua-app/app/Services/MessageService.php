<?php

namespace App\Services;

use App\Enums\AuditAction;
use App\Models\Message;
use Illuminate\Database\Eloquent\Collection;

class MessageService
{
    /**
     * @return Collection<int, Message>
     */
    public function all(): Collection
    {
        return Message::orderBy('created_at', 'desc')->get();
    }

    public function create(array $attributes): Message
    {
        return Message::create([...$attributes, 'status' => 'new']);
    }

    public function updateStatus(Message $message, string $status): Message
    {
        $from = $message->status;
        $message->update(['status' => $status]);
        $message->auditAs(AuditAction::StatusChange, ['from' => $from, 'to' => $status]);

        return $message;
    }

    /**
     * Iterates model instances individually — never a mass whereIn()->update()
     * — so every message in the batch fires its own model event and gets
     * its own audit log entry.
     *
     * @param  array<int, string>  $ids
     */
    public function bulkUpdateStatus(array $ids, string $status): void
    {
        Message::whereIn('id', $ids)->get()->each(function (Message $message) use ($status) {
            $from = $message->status;
            $message->update(['status' => $status]);
            $message->auditAs(AuditAction::StatusChange, ['from' => $from, 'to' => $status]);
        });
    }

    public function delete(Message $message): void
    {
        $message->delete();
    }

    /**
     * @param  array<int, string>  $ids
     */
    public function bulkDelete(array $ids): void
    {
        Message::whereIn('id', $ids)->get()->each->delete();
    }

    /**
     * Backs the admin overview page's messages widgets — total, per-status
     * counts, and the 5 most recent — in one call, replacing the frontend's
     * three separate direct Supabase queries.
     *
     * @return array{total: int, by_status: array<string, int>, recent: Collection<int, Message>}
     */
    public function summary(): array
    {
        $counts = Message::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return [
            'total' => (int) $counts->sum(),
            'by_status' => [
                'new' => (int) ($counts['new'] ?? 0),
                'in_progress' => (int) ($counts['in_progress'] ?? 0),
                'replied' => (int) ($counts['replied'] ?? 0),
                'archived' => (int) ($counts['archived'] ?? 0),
            ],
            'recent' => Message::orderBy('created_at', 'desc')->limit(5)->get(),
        ];
    }
}
