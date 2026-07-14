<?php

namespace App\Policies;

use App\Models\User;

class MessagePolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->isStaff();
    }

    public function update(User $actor): bool
    {
        return $actor->isStaff();
    }

    public function delete(User $actor): bool
    {
        return $actor->isStaff();
    }
}
