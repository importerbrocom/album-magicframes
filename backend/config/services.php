<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google_drive' => [
        // api_key | oauth
        'auth_mode' => env('GOOGLE_DRIVE_AUTH_MODE', 'api_key'),
        'api_key' => env('GOOGLE_DRIVE_API_KEY'),
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect_uri' => env('GOOGLE_REDIRECT_URI'),
        'refresh_token' => env('GOOGLE_REFRESH_TOKEN'),
        // Demo fallback for local UI development when no credentials exist.
        'demo_mode' => env('DRIVE_DEMO_MODE', false),
    ],

    'album' => [
        'public_base_url' => env('ALBUM_PUBLIC_BASE_URL', env('FRONTEND_URL', 'http://localhost:5173')),
        'token_secret' => env('ALBUM_TOKEN_SECRET'),
        'token_ttl_hours' => (int) env('ALBUM_TOKEN_TTL_HOURS', 24),
    ],

];
