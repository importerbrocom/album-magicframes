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
        'film_drive_id',
        'film_url_override',
        'parent_id',
        'cover_image_url',
        'cover_override',
        'photo_count',
        'sort_order',
        'is_available',
    ];

    /**
     * Effective cover for the public card: the admin override wins, else the
     * auto-detected cover from sync.
     */
    public function effectiveCover(): ?string
    {
        return $this->cover_override ?: $this->cover_image_url;
    }

    /**
     * Effective playable film source for the public card:
     *  - a manual override URL (YouTube/Vimeo/Drive/mp4) wins; if it's a Drive
     *    link it is streamed through the per-section proxy route;
     *  - else an auto-detected Drive video in the folder (film_drive_id);
     *  - else null.
     */
    public function effectiveFilmSrc(): ?string
    {
        $slug = optional($this->album)->slug;
        if (! $slug) {
            return null;
        }

        if ($this->film_url_override) {
            $override = $this->film_url_override;
            if (str_contains($override, 'drive.google.com')) {
                return route('public.events.film', ['slug' => $slug, 'event' => $this->slug], false);
            }

            return $override; // YouTube / Vimeo / direct mp4 — played as-is
        }

        if ($this->film_drive_id) {
            return route('public.events.film', ['slug' => $slug, 'event' => $this->slug], false);
        }

        return null;
    }

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
