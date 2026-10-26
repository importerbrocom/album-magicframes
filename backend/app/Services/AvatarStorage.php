<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Stores profile photos on the "public" disk (served via the storage:link
 * symlink at /storage/...). Old photos are removed when replaced or cleared.
 */
class AvatarStorage
{
    private const DIR = 'avatars';

    /** Store a new avatar for the user, deleting any previous one. */
    public function store(User $user, UploadedFile $file): string
    {
        $this->deleteExisting($user);

        $path = $file->store(self::DIR, 'public');
        $user->avatar_path = $path;

        return $path;
    }

    /** Remove the user's avatar file + clear the column. */
    public function remove(User $user): void
    {
        $this->deleteExisting($user);
        $user->avatar_path = null;
    }

    private function deleteExisting(User $user): void
    {
        if ($user->avatar_path && Storage::disk('public')->exists($user->avatar_path)) {
            Storage::disk('public')->delete($user->avatar_path);
        }
    }
}
