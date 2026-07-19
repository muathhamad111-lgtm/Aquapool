<?php

namespace App\Services;

use App\Enums\AuditAction;
use App\Enums\MessageStatus;
use App\Models\Message;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class MessageService
{
    public const DEFAULT_PER_PAGE = 25;

    /**
     * @param  array{page?: int, per_page?: int, status?: string, search?: string}  $filters
     * @return LengthAwarePaginator<int, Message>
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->query($filters)
            ->orderByDesc('created_at')
            // Messages have no updated_at and a burst of submissions can
            // share a created_at second, so created_at alone is not a
            // unique ordering — without a tiebreaker, rows sharing a
            // timestamp can repeat or vanish across page boundaries.
            ->orderByDesc('id')
            ->paginate(
                perPage: $filters['per_page'] ?? self::DEFAULT_PER_PAGE,
                page: $filters['page'] ?? 1,
            );
    }

    /**
     * @param  array{status?: string, search?: string}  $filters
     * @return Builder<Message>
     */
    private function query(array $filters): Builder
    {
        return Message::query()
            ->when(
                isset($filters['status']),
                fn (Builder $query) => $query->where('status', $filters['status']),
            )
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(
                    fn (Builder $group) => $this->applySearch($group, $filters['search']),
                ),
            );
    }

    /**
     * Mirrors the fields the admin inbox used to search client-side.
     * Compares lower-cased values rather than using ILIKE so the behaviour
     * is identical on PostgreSQL (production) and sqlite (the test suite).
     *
     * @param  Builder<Message>  $query
     */
    private function applySearch(Builder $query, string $search): void
    {
        $term = '%'.mb_strtolower(trim($search)).'%';

        foreach (['name', 'email', 'subject', 'message'] as $column) {
            $query->orWhereRaw("lower({$column}) like ?", [$term]);
        }
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
