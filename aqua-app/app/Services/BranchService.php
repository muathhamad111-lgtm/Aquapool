<?php

namespace App\Services;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Collection;

class BranchService
{
    /**
     * Every branch, for the admin list.
     *
     * @return Collection<int, Branch>
     */
    public function all(): Collection
    {
        return Branch::orderBy('sort_order')->get();
    }

    /**
     * Published branches only, in display order. The first is treated as
     * the primary branch by the site footer, which has room for one.
     *
     * @return Collection<int, Branch>
     */
    public function publicList(): Collection
    {
        return Branch::where('is_published', true)->orderBy('sort_order')->get();
    }

    /**
     * Refreshed before returning: `is_published` and `sort_order` have
     * database defaults, and a model built from only the submitted
     * attributes reports them as null. The create response would then tell
     * the client a branch is unpublished while the stored row says
     * otherwise.
     */
    public function create(array $attributes): Branch
    {
        return tap(Branch::create($attributes))->refresh();
    }

    public function update(Branch $branch, array $attributes): Branch
    {
        $branch->update($attributes);

        return $branch;
    }

    public function delete(Branch $branch): void
    {
        $branch->delete();
    }
}
