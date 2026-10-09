<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnalyticsEvent extends Model
{
    protected $fillable = [
        'album_id',
        'type',
        'event_id',
        'photo_id',
        'visitor_hash',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }
}
