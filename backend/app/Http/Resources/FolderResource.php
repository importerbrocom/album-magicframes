<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FolderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'event_id' => $this->event_id,
            'cover_image_url' => $this->cover_image_url,
            'photo_count' => $this->photo_count,
            'sort_order' => $this->sort_order,
        ];
    }
}
