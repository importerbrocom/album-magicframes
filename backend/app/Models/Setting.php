<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Global key-value settings (studio-wide). Values are cached for fast reads.
 */
class Setting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    /** Keys for the global social media links shown on every album. */
    public const SOCIAL_KEYS = [
        'social_instagram_url',
        'social_whatsapp_url',
        'social_facebook_url',
        'social_pinterest_url',
    ];

    public static function get(string $key, $default = null)
    {
        return Cache::rememberForever("setting.$key", fn () => static::query()->find($key)?->value ?? $default);
    }

    public static function put(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value]);
        Cache::forget("setting.$key");
    }

    /** The global social links as a {instagram,whatsapp,facebook,pinterest} map. */
    public static function socialLinks(): array
    {
        return [
            'instagram' => static::get('social_instagram_url'),
            'whatsapp' => static::get('social_whatsapp_url'),
            'facebook' => static::get('social_facebook_url'),
            'pinterest' => static::get('social_pinterest_url'),
        ];
    }
}
