<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\ProductCategories\StoreProductCategoryRequest;
use App\Http\Requests\V1\ProductCategories\UpdateProductCategoryRequest;
use App\Http\Resources\V1\ProductCategoryResource;
use App\Models\ProductCategory;
use App\Services\ProductCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductCategoryController extends ApiController
{
    public function __construct(private readonly ProductCategoryService $categories) {}

    public function publicIndex(Request $request): JsonResponse
    {
        $request->validate([
            'kind' => ['required', 'in:product,service,project'],
        ]);

        return $this->success(
            ProductCategoryResource::collection($this->categories->publicList($request->string('kind')->value())),
        );
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', ProductCategory::class);

        return $this->success(ProductCategoryResource::collection($this->categories->all()));
    }

    public function store(StoreProductCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', ProductCategory::class);

        $category = $this->categories->create($request->validated());

        return $this->created(new ProductCategoryResource($category));
    }

    public function update(UpdateProductCategoryRequest $request, ProductCategory $productCategory): JsonResponse
    {
        $this->authorize('update', ProductCategory::class);

        $category = $this->categories->update($productCategory, $request->validated());

        return $this->success(new ProductCategoryResource($category));
    }

    public function destroy(ProductCategory $productCategory): JsonResponse
    {
        $this->authorize('delete', ProductCategory::class);

        $this->categories->delete($productCategory);

        return $this->success(message: 'Category deleted.');
    }
}
