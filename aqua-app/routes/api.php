<?php

use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\ImageUploadController;
use App\Http\Controllers\Api\V1\MessageController;
use App\Http\Controllers\Api\V1\ProductCategoryController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\SiteSettingController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class);

    // Public — no auth. Site settings have no draft/publish state, the
    // stored value is always what's live, so reads are the same for
    // everyone; only writing requires a staff session (below).
    Route::get('/settings', [SiteSettingController::class, 'index']);

    // Public — no auth. Always filtered to published categories only;
    // the admin (unfiltered, all-kinds) list lives under /admin below.
    Route::get('/product-categories', [ProductCategoryController::class, 'publicIndex']);

    // Public — no auth. Always filtered to published services only.
    Route::get('/services', [ServiceController::class, 'publicIndex']);

    // Public — no auth. Always filtered to published products only.
    Route::get('/products', [ProductController::class, 'publicIndex']);

    // Public — no auth. Always filtered to published projects only.
    Route::get('/projects', [ProjectController::class, 'publicIndex']);

    // Public — no auth, matching Supabase's `anon, authenticated` insert
    // grant on the contact form. Rate-limited (5/minute/IP) — a new
    // protection not present in Supabase today, since RLS there only
    // checked field lengths, not submission frequency.
    Route::post('/messages', [MessageController::class, 'store'])->middleware('throttle:5,1');

    Route::prefix('admin')->group(function () {
        // Rate-limited (5/minute per email+IP) against credential stuffing —
        // see the 'login' limiter in AppServiceProvider.
        Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/auth/logout', [AuthController::class, 'logout']);
            Route::get('/auth/me', [AuthController::class, 'me']);

            Route::get('/users', [UserController::class, 'index']);
            Route::post('/users', [UserController::class, 'store']);
            Route::patch('/users/{user}/password', [UserController::class, 'resetPassword']);
            Route::delete('/users/{user}', [UserController::class, 'destroy']);

            Route::get('/audit-logs', [AuditLogController::class, 'index']);

            Route::put('/settings/{key}', [SiteSettingController::class, 'update']);

            Route::post('/uploads', [ImageUploadController::class, 'store']);

            Route::get('/product-categories', [ProductCategoryController::class, 'index']);
            Route::post('/product-categories', [ProductCategoryController::class, 'store']);
            Route::patch('/product-categories/{productCategory}', [ProductCategoryController::class, 'update']);
            Route::delete('/product-categories/{productCategory}', [ProductCategoryController::class, 'destroy']);

            Route::get('/services', [ServiceController::class, 'index']);
            Route::post('/services', [ServiceController::class, 'store']);
            Route::patch('/services/{service}', [ServiceController::class, 'update']);
            Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

            Route::get('/products', [ProductController::class, 'index']);
            Route::post('/products', [ProductController::class, 'store']);
            Route::patch('/products/{product}', [ProductController::class, 'update']);
            Route::delete('/products/{product}', [ProductController::class, 'destroy']);

            Route::get('/projects', [ProjectController::class, 'index']);
            Route::post('/projects', [ProjectController::class, 'store']);
            Route::patch('/projects/{project}', [ProjectController::class, 'update']);
            Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

            Route::get('/messages', [MessageController::class, 'index']);
            Route::get('/messages/summary', [MessageController::class, 'summary']);
            Route::patch('/messages/status', [MessageController::class, 'bulkUpdateStatus']);
            Route::delete('/messages', [MessageController::class, 'bulkDestroy']);
            Route::patch('/messages/{message}/status', [MessageController::class, 'updateStatus']);
            Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
        });
    });
});
