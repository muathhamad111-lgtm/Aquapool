<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\Uploads\StoreImageUploadRequest;
use App\Services\ImageUploadService;
use Illuminate\Http\JsonResponse;

class ImageUploadController extends ApiController
{
    public function __construct(private readonly ImageUploadService $uploads) {}

    public function store(StoreImageUploadRequest $request): JsonResponse
    {
        abort_unless($request->user()->isStaff(), 403);

        $url = $this->uploads->store($request->file('file'), $request->validated('folder'));

        return $this->created(['url' => $url]);
    }
}
