<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAlbumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'client_name' => ['sometimes', 'string', 'max:150'],
            'title' => ['sometimes', 'string', 'max:200'],
            'category' => ['nullable', 'string', 'max:80'],
            'event_date' => ['nullable', 'date'],
            'google_drive_url' => ['sometimes', 'string', 'max:500'],
            // Password optional on update; only changes if provided.
            'password' => ['nullable', 'string', 'min:4', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'tagline' => ['nullable', 'string', 'max:200'],
            'cover_image_url' => ['nullable', 'string', 'max:1000'],
            'film_url' => ['nullable', 'url', 'max:1000'],
            'theme' => ['sometimes', Rule::in(['classic', 'modern', 'cinematic', 'minimal', 'luxury', 'traditional', 'akhila'])],
            'ambient_effect' => ['nullable', Rule::in(['none', 'auto', 'leaves', 'flowers', 'petals', 'snow', 'confetti', 'sprinkles', 'balloons', 'bubbles', 'hearts'])],
            'ambient_speed' => ['nullable', Rule::in(['slow', 'normal', 'fast'])],
            'ambient_count' => ['nullable', 'integer', 'min:0', 'max:60'],
            'status' => ['sometimes', Rule::in(['active', 'disabled', 'draft'])],
            'allow_download' => ['sometimes', 'boolean'],
            'allow_share' => ['sometimes', 'boolean'],
            'allow_comments' => ['sometimes', 'boolean'],
            'allow_enquiries' => ['sometimes', 'boolean'],
            'google_review_url' => ['nullable', 'url', 'max:1000'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
