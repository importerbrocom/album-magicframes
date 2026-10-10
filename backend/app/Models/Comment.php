<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    protected $fillable = [
        'album_id',
        'album_slug',
        'name',
        'body',
        'is_approved',
        'visitor_hash',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
    ];

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }
}
