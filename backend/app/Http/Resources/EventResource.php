<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Per-section film: when a video was detected in the section's Drive
        // folder, expose a proxied streaming URL the card can play.
        $albumSlug = $this->additional['album_slug'] ?? optional($this->album)->slug;
        $filmSrc = ($this->film_drive_id && $albumSlug)
            ? route('public.events.film', ['slug' => $albumSlug, 'event' => $this->slug], false)
            : null;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'cover_image_url' => $this->cover_image_url,
            'film_src' => $filmSrc,
            'photo_count' => $this->photo_count,
            'sort_order' => $this->sort_order,
            'folders' => FolderResource::collection($this->whenLoaded('rootFolders')),
        ];
    }
}
