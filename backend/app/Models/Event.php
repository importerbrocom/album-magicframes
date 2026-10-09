<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'album_id',
        'name',
        'slug',
        'google_drive_folder_id',
        'parent_id',
        'cover_image_url',
        'photo_count',
        'sort_order',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
    ];

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Event::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Event::class, 'parent_id');
    }

    public function folders(): HasMany
    {
        return $this->hasMany(Folder::class);
    }

    /** Top-level folders only (no parent). */
    public function rootFolders(): HasMany
    {
        return $this->hasMany(Folder::class)->whereNull('parent_id');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }
}
