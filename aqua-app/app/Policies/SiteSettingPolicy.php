<?php

namespace App\Policies;

use App\Models\User;

class SiteSettingPolicy
{
    public function update(User $actor): bool
    {
        return $actor->isStaff();
    }
}
