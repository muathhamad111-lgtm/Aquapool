<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\Services\StoreServiceRequest;
use App\Http\Requests\V1\Services\UpdateServiceRequest;
use App\Http\Resources\V1\ServiceResource;
use App\Models\Service;
use App\Services\ServiceService;
use Illuminate\Http\JsonResponse;

class ServiceController extends ApiController
{
    public function __construct(private readonly ServiceService $services) {}

    public function publicIndex(): JsonResponse
    {
        return $this->success(ServiceResource::collection($this->services->publicList()));
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Service::class);

        return $this->success(ServiceResource::collection($this->services->all()));
    }

    public function store(StoreServiceRequest $request): JsonResponse
    {
        $this->authorize('create', Service::class);

        $service = $this->services->create($request->validated());

        return $this->created(new ServiceResource($service));
    }

    public function update(UpdateServiceRequest $request, Service $service): JsonResponse
    {
        $this->authorize('update', Service::class);

        $service = $this->services->update($service, $request->validated());

        return $this->success(new ServiceResource($service));
    }

    public function destroy(Service $service): JsonResponse
    {
        $this->authorize('delete', Service::class);

        $this->services->delete($service);

        return $this->success(message: 'Service deleted.');
    }
}
