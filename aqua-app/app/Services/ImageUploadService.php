<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadService
{
    /**
     * Stores an uploaded image under the public disk and returns its public
     * URL. The filename is always server-generated — never derived from the
     * client's original filename — so nothing about the stored path is
     * client-controlled beyond the (allow-listed) folder name.
     */
    public function store(UploadedFile $file, string $folder): string
    {
        $filename = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();

        $path = $file->storeAs($folder, $filename, 'public');

        return Storage::disk('public')->url($path);
    }
}
