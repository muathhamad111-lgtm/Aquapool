<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->isStaff();
    }

    public function create(User $actor, string $role = User::ROLE_USER): bool
    {
        if (! $actor->isStaff()) {
            return false;
        }

        if ($role === User::ROLE_ADMIN) {
            return $actor->isAdmin();
        }

        return true;
    }

    public function delete(User $actor, User $target): bool
    {
        return $actor->isAdmin() && $actor->id !== $target->id;
    }

    public function resetPassword(User $actor, User $target): bool
    {
        if (! $actor->isStaff()) {
            return false;
        }

        if ($target->isAdmin()) {
            return $actor->isAdmin();
        }

        return true;
    }
}
