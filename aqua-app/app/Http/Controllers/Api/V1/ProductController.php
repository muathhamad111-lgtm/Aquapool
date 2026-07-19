<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\Products\StoreProductRequest;
use App\Http\Requests\V1\Products\UpdateProductRequest;
use App\Http\Resources\V1\ProductDetailResource;
use App\Http\Resources\V1\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;

class ProductController extends ApiController
{
    public function __construct(private readonly ProductService $products) {}

    public function publicIndex(): JsonResponse
    {
        return $this->success(ProductResource::collection($this->products->publicList()));
    }

    /**
     * Public — no auth. Unpublished products 404 here rather than 403, so a
     * visitor can't distinguish a hidden product from one that never
     * existed.
     */
    public function publicShow(string $slug): JsonResponse
    {
        return $this->success(
            new ProductDetailResource($this->products->publicFindBySlug($slug))
        );
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        return $this->success(ProductResource::collection($this->products->all()));
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $this->authorize('create', Product::class);

        $product = $this->products->create($request->validated());

        return $this->created(new ProductResource($product));
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', Product::class);

        $product = $this->products->update($product, $request->validated());

        return $this->success(new ProductResource($product));
    }

    public function destroy(Product $product): JsonResponse
    {
        $this->authorize('delete', Product::class);

        $this->products->delete($product);

        return $this->success(message: 'Product deleted.');
    }
}
