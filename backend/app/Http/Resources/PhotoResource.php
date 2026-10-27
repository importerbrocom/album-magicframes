<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PhotoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $slug = $this->additional['album_slug'] ?? optional($this->album)->slug;
        $isDemo = ($this->additional['drive_auth_mode'] ?? optional($this->album)->drive_auth_mode) === 'demo';

        // Demo albums use stored public placeholder URLs; real albums use the
        // authenticated image proxy (private Drive links can't load directly).
        $thumb = $isDemo
            ? $this->thumbnail_url
            : route('public.photos.thumb', ['slug' => $slug, 'id' => $this->id], false);
        $preview = $isDemo
            ? $this->preview_url
            : route('public.photos.preview', ['slug' => $slug, 'id' => $this->id], false);
        // Highest-quality render for the full-screen viewer (up to ~4K).
        $full = $isDemo
            ? ($this->original_url ?: $this->preview_url)
            : route('public.photos.full', ['slug' => $slug, 'id' => $this->id], false);

        return [
            'id' => $this->id,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'width' => $this->width,
            'height' => $this->height,
            'thumbnail_url' => $thumb,
            'preview_url' => $preview,
            'full_url' => $full,
            // download_url is only exposed when downloads are allowed. It always
            // points at the Laravel proxy route (never a raw Drive link).
            'download_url' => $this->when(
                (bool) ($this->additional['allow_download'] ?? false),
                fn () => route('public.photos.download', ['slug' => $slug, 'id' => $this->id], false),
            ),
            'sort_order' => $this->sort_order,
            'event_id' => $this->event_id,
            'folder_id' => $this->folder_id,
        ];
    }
}
