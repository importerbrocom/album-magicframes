<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enquiry extends Model
{
    protected $fillable = [
        'album_id',
        'album_slug',
        'name',
        'phone',
        'email',
        'message',
        'crn_status',
        'crn_response',
        'visitor_hash',
    ];

    public function album(): BelongsTo
    {
        return $this->belongsTo(Album::class);
    }
}
