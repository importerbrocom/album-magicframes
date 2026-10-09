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
            'google_drive_url' => ['sometimes', 'string', 'max:500'],
            // Password optional on update; only changes if provided.
            'password' => ['nullable', 'string', 'min:4', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'tagline' => ['nullable', 'string', 'max:200'],
            'cover_image_url' => ['nullable', 'string', 'max:1000'],
            'theme' => ['sometimes', Rule::in(['classic', 'modern', 'cinematic', 'minimal', 'luxury', 'traditional'])],
            'status' => ['sometimes', Rule::in(['active', 'disabled', 'draft'])],
            'allow_download' => ['sometimes', 'boolean'],
            'allow_share' => ['sometimes', 'boolean'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
