<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Stores profile photos on the "public" disk (served via `storage:link`).
 * File-type/size validation happens in the FormRequest; this service handles
 * safe naming, replacement of the previous file, and deletion.
 */
class AvatarService
{
    private const DISK = 'public';
    private const DIR = 'avatars';

    /**
     * Store a new avatar for the user, deleting any previous one. Returns the
     * stored relative path.
     */
    public function store(User $user, UploadedFile $file): string
    {
        $this->deleteExisting($user);

        // Never trust the client filename; generate our own + keep the real ext.
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg');
        $name = Str::uuid()->toString() . '.' . $ext;

        $path = $file->storeAs(self::DIR, $name, ['disk' => self::DISK]);

        return $path;
    }

    public function remove(User $user): void
    {
        $this->deleteExisting($user);
    }

    private function deleteExisting(User $user): void
    {
        if ($user->avatar_path && Storage::disk(self::DISK)->exists($user->avatar_path)) {
            Storage::disk(self::DISK)->delete($user->avatar_path);
        }
    }
}
