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
            'cover_image_url' => $this->cover_image_url,
            'photo_count' => $this->photo_count,
            'sort_order' => $this->sort_order,
            'folders' => FolderResource::collection($this->whenLoaded('rootFolders')),
        ];
    }
}
