<?php

namespace App\Policies;

use App\Models\User;

class ServicePolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->isStaff();
    }

    public function create(User $actor): bool
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
