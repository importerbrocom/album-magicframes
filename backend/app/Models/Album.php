<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Album extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_name',
        'title',
        'slug',
        'password_hash',
        'google_drive_folder_id',
        'google_drive_url',
        'drive_auth_mode',
        'cover_photo_id',
        'cover_image_url',
        'film_url',
        'description',
        'tagline',
        'status',
        'theme',
        'allow_download',
        'allow_share',
        'google_review_url',
        'allow_comments',
        'allow_enquiries',
        'sync_status',
        'sync_progress',
        'sync_message',
        'photo_count',
        'event_count',
        'last_synced_at',
        'expires_at',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'allow_download' => 'boolean',
        'allow_share' => 'boolean',
        'allow_comments' => 'boolean',
        'allow_enquiries' => 'boolean',
        'last_synced_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    /** Top-level events only (no parent). */
    public function rootEvents(): HasMany
    {
        return $this->hasMany(Event::class)->whereNull('parent_id');
    }

    public function folders(): HasMany
    {
        return $this->hasMany(Folder::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    public function analyticsEvents(): HasMany
    {
        return $this->hasMany(AnalyticsEvent::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    public function enquiries(): HasMany
    {
        return $this->hasMany(Enquiry::class);
    }

    /**
     * Resolve the playable film source for the public UI:
     *  - a Google Drive file link  -> our streaming proxy route
     *  - any other URL (YouTube/Vimeo/direct mp4) -> passed through as-is
     *  - demo albums                -> the raw link (proxy just redirects)
     * Returns null when the album has no film.
     */
    public function filmSrc(): ?string
    {
        if (! $this->film_url) {
            return null;
        }

        /** @var \App\Services\GoogleDriveService $drive */
        $drive = app(\App\Services\GoogleDriveService::class);

        if ($this->drive_auth_mode !== 'demo' && $drive->extractFileId($this->film_url)) {
            return route('public.albums.film', ['slug' => $this->slug], false);
        }

        return $this->film_url;
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isAccessible(): bool
    {
        return $this->status === 'active' && ! $this->isExpired();
    }
}
