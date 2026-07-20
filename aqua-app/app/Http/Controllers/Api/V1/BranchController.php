<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\Branches\StoreBranchRequest;
use App\Http\Requests\V1\Branches\UpdateBranchRequest;
use App\Http\Resources\V1\BranchResource;
use App\Models\Branch;
use App\Services\BranchService;
use Illuminate\Http\JsonResponse;

class BranchController extends ApiController
{
    public function __construct(private readonly BranchService $branches) {}

    /** Public — no auth. Published branches only. */
    public function publicIndex(): JsonResponse
    {
        return $this->success(BranchResource::collection($this->branches->publicList()));
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Branch::class);

        return $this->success(BranchResource::collection($this->branches->all()));
    }

    public function store(StoreBranchRequest $request): JsonResponse
    {
        $this->authorize('create', Branch::class);

        return $this->created(new BranchResource($this->branches->create($request->validated())));
    }

    public function update(UpdateBranchRequest $request, Branch $branch): JsonResponse
    {
        $this->authorize('update', Branch::class);

        return $this->success(new BranchResource($this->branches->update($branch, $request->validated())));
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $this->authorize('delete', Branch::class);

        $this->branches->delete($branch);

        return $this->success(message: 'Branch deleted.');
    }
}
