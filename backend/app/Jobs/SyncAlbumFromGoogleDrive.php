<?php

namespace App\Jobs;

use App\Models\Album;
use App\Models\Event;
use App\Models\Folder;
use App\Models\Photo;
use App\Services\DemoDriveData;
use App\Services\GoogleDriveException;
use App\Services\GoogleDriveService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Scans an album's Google Drive folder tree and (re)builds its events,
 * folders and photos. Idempotent: files are matched by google_drive_file_id
 * so re-syncs never create duplicates, and vanished files are marked
 * unavailable.
 *
 * Algorithm (spec section 37):
 *   root -> child folders become Events -> their child folders become Folders
 *   -> image files within each node become Photos.
 */
class SyncAlbumFromGoogleDrive implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 1800;
    public int $tries = 2;

    public function __construct(public int $albumId)
    {
    }

    public function handle(GoogleDriveService $drive): void
    {
        $album = Album::find($this->albumId);
        if (! $album) {
            return;
        }

        $this->setStatus($album, 'syncing', 1, 'Starting synchronization...');

        // Track which Drive file IDs are seen this run to mark the rest unavailable.
        $seenFileIds = [];
        $folderCount = 0;
        $photoCount = 0;

        try {
            $demoMode = $album->drive_auth_mode === 'demo'
                || (config('services.google_drive.demo_mode') && ! $drive->isConfigured());

            if ($demoMode) {
                [$folderCount, $photoCount] = $this->syncDemo($album, $seenFileIds);
            } else {
                [$folderCount, $photoCount] = $this->syncDrive($album, $drive, $seenFileIds);
            }

            // Mark photos not seen this run as unavailable (deleted in Drive).
            Photo::where('album_id', $album->id)
                ->when(! empty($seenFileIds), fn ($q) => $q->whereNotIn('google_drive_file_id', $seenFileIds))
                ->update(['is_available' => false]);

            $this->recountAndFinalize($album, $folderCount, $photoCount);

            Cache::forget("album.public.{$album->slug}");
        } catch (GoogleDriveException $e) {
            Log::warning('Album sync failed (Drive)', ['album' => $album->id, 'msg' => $e->getMessage()]);
            $this->setStatus($album, 'failed', $album->sync_progress, $e->userMessage);
        } catch (Throwable $e) {
            Log::error('Album sync failed', ['album' => $album->id, 'msg' => $e->getMessage()]);
            $this->setStatus($album, 'failed', $album->sync_progress, 'Album synchronization failed. Please try again.');
        }
    }

    /**
     * @param array<int,string> $seenFileIds
     * @return array{0:int,1:int} [folderCount, photoCount]
     */
    private function syncDrive(Album $album, GoogleDriveService $drive, array &$seenFileIds): array
    {
        $rootId = $album->google_drive_folder_id;
        $drive->validateFolder($rootId);

        $eventFolders = $drive->listChildFolders($rootId);
        $totalEvents = max(count($eventFolders), 1);
        $folderCount = 0;
        $photoCount = 0;

        $this->setStatus($album, 'syncing', 5, count($eventFolders) . ' events found. Reading photos...');

        $eventSort = 0;
        foreach ($eventFolders as $i => $ef) {
            $event = Event::updateOrCreate(
                ['album_id' => $album->id, 'google_drive_folder_id' => $ef['id']],
                [
                    'name' => $ef['name'],
                    'slug' => $this->uniqueEventSlug($album, $ef['name']),
                    'sort_order' => $eventSort++,
                    'is_available' => true,
                ],
            );

            // Photos directly inside the event folder (no sub-folder).
            $directImages = $drive->listImageFiles($ef['id']);
            $photoCount += $this->storePhotos($album, $event, null, $directImages, $seenFileIds, $drive);

            // Child folders of the event become Folders.
            $childFolders = $drive->listChildFolders($ef['id']);
            $folderSort = 0;
            foreach ($childFolders as $cf) {
                $folderCount++;
                $folder = Folder::updateOrCreate(
                    ['event_id' => $event->id, 'google_drive_folder_id' => $cf['id']],
                    [
                        'album_id' => $album->id,
                        'name' => $cf['name'],
                        'slug' => Str::slug($cf['name']) ?: 'folder-' . $folderSort,
                        'sort_order' => $folderSort++,
                        'is_available' => true,
                    ],
                );

                $images = $drive->listImageFiles($cf['id']);
                $photoCount += $this->storePhotos($album, $event, $folder, $images, $seenFileIds, $drive);
            }

            $progress = (int) (5 + (($i + 1) / $totalEvents) * 90);
            $this->setStatus($album, 'syncing', min($progress, 95),
                "Syncing... {$photoCount} photos, {$folderCount} folders found.");
        }

        return [$folderCount, $photoCount];
    }

    /**
     * @param array<int,string> $seenFileIds
     * @return array{0:int,1:int}
     */
    private function syncDemo(Album $album, array &$seenFileIds): array
    {
        $tree = DemoDriveData::tree();
        $totalEvents = max(count($tree), 1);
        $folderCount = 0;
        $photoCount = 0;
        $eventSort = 0;
        $i = 0;

        foreach ($tree as $eventName => $folderNames) {
            $driveId = 'demo-event-' . Str::slug($eventName);
            $event = Event::updateOrCreate(
                ['album_id' => $album->id, 'google_drive_folder_id' => $driveId],
                [
                    'name' => $eventName,
                    'slug' => $this->uniqueEventSlug($album, $eventName),
                    'sort_order' => $eventSort++,
                    'is_available' => true,
                ],
            );

            if (empty($folderNames)) {
                // Event with photos directly inside it.
                $count = DemoDriveData::photoCount($eventName);
                $photos = DemoDriveData::photos($eventName, $count);
                $photoCount += $this->storeDemoPhotos($album, $event, null, $photos, $seenFileIds);
            } else {
                $folderSort = 0;
                foreach ($folderNames as $folderName) {
                    $folderCount++;
                    $driveFolderId = 'demo-folder-' . Str::slug($eventName . '-' . $folderName);
                    $folder = Folder::updateOrCreate(
                        ['event_id' => $event->id, 'google_drive_folder_id' => $driveFolderId],
                        [
                            'album_id' => $album->id,
                            'name' => $folderName,
                            'slug' => Str::slug($folderName) ?: 'folder-' . $folderSort,
                            'sort_order' => $folderSort++,
                            'is_available' => true,
                        ],
                    );

                    $seed = $eventName . '/' . $folderName;
                    $count = DemoDriveData::photoCount($seed);
                    $photos = DemoDriveData::photos($seed, $count);
                    $photoCount += $this->storeDemoPhotos($album, $event, $folder, $photos, $seenFileIds);
                }
            }

            $i++;
            $progress = (int) (($i / $totalEvents) * 95);
            $this->setStatus($album, 'syncing', max($progress, 5),
                "Syncing... {$photoCount} photos, {$folderCount} folders found.");
        }

        return [$folderCount, $photoCount];
    }

    /**
     * Persist a batch of real Drive image records.
     *
     * @param array<int,array<string,mixed>> $images
     * @param array<int,string> $seenFileIds
     */
    private function storePhotos(Album $album, Event $event, ?Folder $folder, array $images, array &$seenFileIds, GoogleDriveService $drive): int
    {
        $sort = 0;
        foreach ($images as $file) {
            $seenFileIds[] = $file['id'];
            $meta = $file['imageMediaMetadata'] ?? [];

            Photo::updateOrCreate(
                ['album_id' => $album->id, 'google_drive_file_id' => $file['id']],
                [
                    'event_id' => $event->id,
                    'folder_id' => $folder?->id,
                    'file_name' => $file['name'] ?? 'photo.jpg',
                    'mime_type' => $file['mimeType'] ?? null,
                    'file_size' => isset($file['size']) ? (int) $file['size'] : null,
                    'width' => $meta['width'] ?? null,
                    'height' => $meta['height'] ?? null,
                    'thumbnail_url' => $drive->thumbnailUrl($file['thumbnailLink'] ?? null, 400),
                    'preview_url' => $drive->previewUrl($file['thumbnailLink'] ?? null, 1600),
                    // Originals are streamed through the Laravel download proxy
                    // (route resolved from the DB id at serialization time),
                    // never a raw Drive link, so no original_url is stored here.
                    'original_url' => null,
                    'sort_order' => $sort++,
                    'is_available' => true,
                    'drive_created_at' => isset($file['createdTime']) ? \Carbon\Carbon::parse($file['createdTime']) : null,
                ],
            );
        }

        return count($images);
    }

    /**
     * @param array<int,array<string,mixed>> $photos
     * @param array<int,string> $seenFileIds
     */
    private function storeDemoPhotos(Album $album, Event $event, ?Folder $folder, array $photos, array &$seenFileIds): int
    {
        $sort = 0;
        foreach ($photos as $p) {
            $seenFileIds[] = $p['id'];
            $meta = $p['imageMediaMetadata'] ?? [];

            Photo::updateOrCreate(
                ['album_id' => $album->id, 'google_drive_file_id' => $p['id']],
                [
                    'event_id' => $event->id,
                    'folder_id' => $folder?->id,
                    'file_name' => $p['name'],
                    'mime_type' => $p['mimeType'],
                    'file_size' => $p['size'] ?? null,
                    'width' => $meta['width'] ?? null,
                    'height' => $meta['height'] ?? null,
                    'thumbnail_url' => $p['_demo_thumb'],
                    'preview_url' => $p['_demo_preview'],
                    'original_url' => $p['_demo_original'],
                    'sort_order' => $sort++,
                    'is_available' => true,
                    'drive_created_at' => isset($p['createdTime']) ? \Carbon\Carbon::parse($p['createdTime']) : null,
                ],
            );
        }

        return count($photos);
    }

    private function uniqueEventSlug(Album $album, string $name): string
    {
        $base = Str::slug($name) ?: 'event';
        $slug = $base;
        $n = 1;
        while (Event::where('album_id', $album->id)
            ->where('slug', $slug)
            ->where('name', '!=', $name)
            ->exists()) {
            $slug = $base . '-' . (++$n);
        }

        return $slug;
    }

    private function recountAndFinalize(Album $album, int $folderCount, int $photoCount): void
    {
        // Recompute authoritative counts from DB (available photos only).
        foreach ($album->events as $event) {
            $event->photo_count = Photo::where('event_id', $event->id)->where('is_available', true)->count();
            $cover = Photo::where('event_id', $event->id)->where('is_available', true)->orderBy('sort_order')->first();
            $event->cover_image_url = $cover?->thumbnail_url;
            $event->save();

            foreach ($event->folders as $folder) {
                $folder->photo_count = Photo::where('folder_id', $folder->id)->where('is_available', true)->count();
                $fcover = Photo::where('folder_id', $folder->id)->where('is_available', true)->orderBy('sort_order')->first();
                $folder->cover_image_url = $fcover?->thumbnail_url;
                $folder->save();
            }
        }

        $totalPhotos = Photo::where('album_id', $album->id)->where('is_available', true)->count();
        $totalEvents = Event::where('album_id', $album->id)->whereNull('parent_id')->count();

        $album->photo_count = $totalPhotos;
        $album->event_count = $totalEvents;
        $album->sync_status = 'completed';
        $album->sync_progress = 100;
        $album->sync_message = 'Sync completed.';
        $album->last_synced_at = now();

        // Default album cover: first photo of first event, if none set.
        if (! $album->cover_image_url) {
            $firstPhoto = Photo::where('album_id', $album->id)->where('is_available', true)->orderBy('id')->first();
            $album->cover_image_url = $firstPhoto?->preview_url;
            $album->cover_photo_id = $firstPhoto?->id;
        }

        $album->save();
    }

    private function setStatus(Album $album, string $status, int $progress, string $message): void
    {
        $album->forceFill([
            'sync_status' => $status,
            'sync_progress' => $progress,
            'sync_message' => $message,
        ])->save();
    }

    public function failed(Throwable $e): void
    {
        $album = Album::find($this->albumId);
        if ($album) {
            $this->setStatus($album, 'failed', $album->sync_progress, 'Album synchronization failed. Please try again.');
        }
    }
}
