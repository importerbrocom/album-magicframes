<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            // Admin overrides win over auto-detected cover / folder video.
            'cover_image_url' => $this->effectiveCover(),
            'film_src' => $this->effectiveFilmSrc(),
            'photo_count' => $this->photo_count,
            'sort_order' => $this->sort_order,
            'folders' => FolderResource::collection($this->whenLoaded('rootFolders')),
        ];
    }
}
