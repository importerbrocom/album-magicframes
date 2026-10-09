<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'width' => $this->width,
            'height' => $this->height,
            'thumbnail_url' => $this->thumbnail_url,
            'preview_url' => $this->preview_url,
            // download_url is only exposed when downloads are allowed. It always
            // points at the Laravel proxy route (never a raw Drive link).
            'download_url' => $this->when(
                (bool) ($this->additional['allow_download'] ?? false),
                fn () => route('public.photos.download', [
                    'slug' => $this->additional['album_slug'] ?? optional($this->album)->slug,
                    'id' => $this->id,
                ], false),
            ),
            'sort_order' => $this->sort_order,
            'event_id' => $this->event_id,
            'folder_id' => $this->folder_id,
        ];
    }
}
