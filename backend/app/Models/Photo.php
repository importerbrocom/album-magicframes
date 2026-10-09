<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Photo extends Model
{
    use HasFactory;

    protected $fillable = [
        'album_id',
        'event_id',
        'folder_id',
        'google_drive_file_id',
        'file_name',
        'mime_type',
        'file_size',
        'width',
        'height',
        'thumbnail_url',
        'preview_url',
        'original_url',
        'sort_order',
        'is_favorite',
        'is_available',
        'drive_created_at',
    ];

    protected $casts = [
        'is_favorite' => 'boolean',
        'is_available' => 'boolean',
        'drive_created_at' => 'datetime',
    ];

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }
}
