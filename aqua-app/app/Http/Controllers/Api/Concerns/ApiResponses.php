<?php

namespace App\Http\Controllers\Api\Concerns;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Response;

trait ApiResponses
{
    /**
     * Paginated list response. Deliberately keeps `data` a flat array of
     * resources — identical to a non-paginated list — and puts the paging
     * state in a sibling `meta` key, rather than using Laravel's default
     * paginator serialization which nests the rows under `data.data`. A
     * client that only reads `data` keeps working unchanged.
     *
     * @param  LengthAwarePaginator<int, Model>  $paginator
     * @param  class-string<JsonResource>  $resource
     * @param  array<string, mixed>  $extraMeta  module-specific meta (e.g. filter counts)
     */
    protected function paginated(LengthAwarePaginator $paginator, string $resource, array $extraMeta = []): JsonResponse
    {
        return response()->json([
            'data' => $resource::collection($paginator->getCollection()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                ...$extraMeta,
            ],
        ]);
    }

    protected function success(mixed $data = null, ?string $message = null, int $status = 200): JsonResponse
    {
        return response()->json(array_filter([
            'data' => $data,
            'message' => $message,
        ], fn ($value) => $value !== null), $status);
    }

    protected function created(mixed $data = null, ?string $message = null): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    protected function noContent(): Response
    {
        return response()->noContent();
    }

    protected function error(string $message, int $status = 422, ?array $errors = null): JsonResponse
    {
        return response()->json(array_filter([
            'message' => $message,
            'errors' => $errors,
        ], fn ($value) => $value !== null), $status);
    }
}
