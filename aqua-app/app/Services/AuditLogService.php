<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class AuditLogService
{
    public const DEFAULT_PER_PAGE = 25;

    /**
     * @param  array{page?: int, per_page?: int, entity_type?: string, search?: string}  $filters
     * @return LengthAwarePaginator<int, AuditLog>
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->query($filters)
            ->orderByDesc('created_at')
            // audit_logs has no updated_at and rows are written in bulk
            // within a single request, so created_at alone is not a unique
            // ordering — without a tiebreaker, rows sharing a timestamp can
            // repeat or vanish across page boundaries.
            ->orderByDesc('id')
            ->paginate(
                perPage: $filters['per_page'] ?? self::DEFAULT_PER_PAGE,
                page: $filters['page'] ?? 1,
            );
    }

    /**
     * Row count per entity type across the whole table — backs the entity
     * filter chips, which must show totals, not just what's on this page.
     * Deliberately ignores the active filters, matching how the counts
     * behaved when the frontend computed them from a full client-side list.
     *
     * @return array<string, int>
     */
    public function entityCounts(): array
    {
        return AuditLog::selectRaw('entity_type, count(*) as count')
            ->groupBy('entity_type')
            ->pluck('count', 'entity_type')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    /**
     * @param  array{entity_type?: string, search?: string}  $filters
     * @return Builder<AuditLog>
     */
    private function query(array $filters): Builder
    {
        return AuditLog::query()
            ->when(
                isset($filters['entity_type']),
                fn (Builder $query) => $query->where('entity_type', $filters['entity_type']),
            )
            ->when(
                filled($filters['search'] ?? null),
                fn (Builder $query) => $query->where(
                    fn (Builder $group) => $this->applySearch($group, $filters['search']),
                ),
            );
    }

    /**
     * Mirrors the fields the admin UI used to search client-side. Compares
     * lower-cased values rather than using ILIKE so the behaviour is
     * identical on PostgreSQL (production) and sqlite (the test suite).
     *
     * @param  Builder<AuditLog>  $query
     */
    private function applySearch(Builder $query, string $search): void
    {
        $term = '%'.mb_strtolower(trim($search)).'%';

        foreach (['user_email', 'entity_label', 'action', 'entity_type'] as $column) {
            $query->orWhereRaw("lower({$column}) like ?", [$term]);
        }
    }
}
