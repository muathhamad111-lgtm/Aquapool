<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class UserService
{
    /**
     * @return Collection<int, User>
     */
    public function list(): Collection
    {
        return User::orderByDesc('created_at')->get();
    }

    public function create(string $email, string $password, string $role): User
    {
        return User::create([
            'name' => Str::before($email, '@'),
            'email' => $email,
            'password' => $password,
            'role' => $role,
        ]);
    }

    public function resetPassword(User $target, string $password): void
    {
        $target->forceFill(['password' => $password])->save();
    }

    public function delete(User $target): void
    {
        $target->delete();
    }
}
