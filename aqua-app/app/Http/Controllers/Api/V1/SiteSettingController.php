<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\Settings\UpdateSiteSettingRequest;
use App\Models\SiteSetting;
use App\Services\SiteSettingService;
use Illuminate\Http\JsonResponse;

class SiteSettingController extends ApiController
{
    private const ALLOWED_KEYS = ['hero', 'about', 'values', 'contact'];

    public function __construct(private readonly SiteSettingService $settings) {}

    public function index(): JsonResponse
    {
        return $this->success($this->settings->all());
    }

    public function update(UpdateSiteSettingRequest $request, string $key): JsonResponse
    {
        abort_unless(in_array($key, self::ALLOWED_KEYS, true), 404, 'Resource not found.');

        $this->authorize('update', SiteSetting::class);

        $setting = $this->settings->update($key, $request->input('value', []));

        return $this->success($setting->value);
    }
}
