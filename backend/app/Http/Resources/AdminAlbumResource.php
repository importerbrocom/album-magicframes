<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Admin album payload. Includes management metadata but still never exposes
 * the password hash (hidden on the model) or Google credentials.
 */
class AdminAlbumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_name' => $this->client_name,
            'title' => $this->title,
            'slug' => $this->slug,
            'google_drive_url' => $this->google_drive_url,
            'google_drive_folder_id' => $this->google_drive_folder_id,
            'drive_auth_mode' => $this->drive_auth_mode,
            'cover_image_url' => $this->cover_image_url,
            'description' => $this->description,
            'tagline' => $this->tagline,
            'status' => $this->status,
            'theme' => $this->theme,
            'allow_download' => $this->allow_download,
            'allow_share' => $this->allow_share,
            'allow_comments' => $this->allow_comments,
            'allow_enquiries' => $this->allow_enquiries,
            'google_review_url' => $this->google_review_url,
            'sync_status' => $this->sync_status,
            'sync_progress' => $this->sync_progress,
            'sync_message' => $this->sync_message,
            'photo_count' => $this->photo_count,
            'event_count' => $this->event_count,
            'last_synced_at' => $this->last_synced_at,
            'expires_at' => $this->expires_at,
            'public_url' => app(\App\Services\AlbumService::class)->publicUrl($this->resource),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
