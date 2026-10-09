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
        'description',
        'tagline',
        'status',
        'theme',
        'allow_download',
        'allow_share',
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

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isAccessible(): bool
    {
        return $this->status === 'active' && ! $this->isExpired();
    }
}
