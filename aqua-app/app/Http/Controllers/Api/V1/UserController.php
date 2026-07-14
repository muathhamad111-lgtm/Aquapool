<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\Users\ResetUserPasswordRequest;
use App\Http\Requests\V1\Users\StoreUserRequest;
use App\Http\Resources\V1\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends ApiController
{
    public function __construct(private readonly UserService $users) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return $this->success(UserResource::collection($this->users->list()));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $role = $request->validated('role');

        $this->authorize('create', [User::class, $role]);

        $user = $this->users->create(
            $request->validated('email'),
            $request->validated('password'),
            $role,
        );

        return $this->created(new UserResource($user));
    }

    public function resetPassword(ResetUserPasswordRequest $request, User $user): JsonResponse
    {
        $this->authorize('resetPassword', $user);

        $this->users->resetPassword($user, $request->validated('password'));

        return $this->success(message: 'Password updated.');
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->users->delete($user);

        return $this->success(message: 'User deleted.');
    }
}
