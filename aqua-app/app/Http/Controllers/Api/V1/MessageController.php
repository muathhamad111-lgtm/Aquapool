<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\V1\Messages\BulkDeleteMessageRequest;
use App\Http\Requests\V1\Messages\BulkUpdateMessageStatusRequest;
use App\Http\Requests\V1\Messages\StoreMessageRequest;
use App\Http\Requests\V1\Messages\UpdateMessageStatusRequest;
use App\Http\Resources\V1\MessageResource;
use App\Models\Message;
use App\Services\MessageService;
use Illuminate\Http\JsonResponse;

class MessageController extends ApiController
{
    public function __construct(private readonly MessageService $messages) {}

    /**
     * Public — no auth, rate-limited (see routes/api.php). Anyone can
     * submit, matching Supabase's `anon, authenticated` insert grant.
     */
    public function store(StoreMessageRequest $request): JsonResponse
    {
        $message = $this->messages->create($request->validated());

        return $this->created(new MessageResource($message));
    }

    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Message::class);

        return $this->success(MessageResource::collection($this->messages->all()));
    }

    public function summary(): JsonResponse
    {
        $this->authorize('viewAny', Message::class);

        $summary = $this->messages->summary();

        return $this->success([
            'total' => $summary['total'],
            'by_status' => $summary['by_status'],
            'recent' => MessageResource::collection($summary['recent']),
        ]);
    }

    public function updateStatus(UpdateMessageStatusRequest $request, Message $message): JsonResponse
    {
        $this->authorize('update', Message::class);

        $message = $this->messages->updateStatus($message, $request->string('status')->value());

        return $this->success(new MessageResource($message));
    }

    public function bulkUpdateStatus(BulkUpdateMessageStatusRequest $request): JsonResponse
    {
        $this->authorize('update', Message::class);

        $this->messages->bulkUpdateStatus($request->input('ids'), $request->string('status')->value());

        return $this->success(message: 'Messages updated.');
    }

    public function destroy(Message $message): JsonResponse
    {
        $this->authorize('delete', Message::class);

        $this->messages->delete($message);

        return $this->success(message: 'Message deleted.');
    }

    public function bulkDestroy(BulkDeleteMessageRequest $request): JsonResponse
    {
        $this->authorize('delete', Message::class);

        $this->messages->bulkDelete($request->input('ids'));

        return $this->success(message: 'Messages deleted.');
    }
}
