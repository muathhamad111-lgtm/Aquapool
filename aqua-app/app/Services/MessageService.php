<?php

namespace App\Services;

use App\Enums\AuditAction;
use App\Enums\MessageStatus;
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
        return Message::create([...$attributes, 'status' => MessageStatus::New->value]);
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
        $byStatus = $this->statusCounts();

        return [
            'total' => array_sum($byStatus),
            'by_status' => $byStatus,
            'recent' => Message::orderBy('created_at', 'desc')->limit(5)->get(),
        ];
    }

    /**
     * Row count per status across the whole table. Every status in the enum
     * is always present, zero included — a client rendering one chip per
     * status must not have to guess whether a missing key means zero.
     *
     * @return array<string, int>
     */
    public function statusCounts(): array
    {
        $counts = Message::selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        return collect(MessageStatus::values())
            ->mapWithKeys(fn (string $status) => [$status => (int) ($counts[$status] ?? 0)])
            ->all();
    }
}
