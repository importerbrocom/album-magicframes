<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Public-facing album payload. NEVER includes password_hash, Drive IDs,
 * credentials or owner info.
 */
class PublicAlbumResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'slug' => $this->slug,
            'client_name' => $this->client_name,
            'title' => $this->title,
            'description' => $this->description,
            'tagline' => $this->tagline,
            'cover_image_url' => $this->cover_image_url,
            'theme' => $this->theme,
            'allow_download' => $this->allow_download,
            'allow_share' => $this->allow_share,
            'allow_comments' => $this->allow_comments,
            'allow_enquiries' => $this->allow_enquiries,
            'google_review_url' => $this->google_review_url ?: config('services.album.google_review_url'),
            'photo_count' => $this->photo_count,
            'event_count' => $this->event_count,
            'sync_status' => $this->sync_status,
            'events' => EventResource::collection($this->whenLoaded('rootEvents')),
        ];
    }
}
