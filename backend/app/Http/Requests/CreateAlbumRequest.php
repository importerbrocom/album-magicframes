<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateAlbumRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'client_name' => ['required', 'string', 'max:150'],
            'title' => ['required', 'string', 'max:200'],
            'google_drive_url' => ['required', 'string', 'max:500'],
            'password' => ['required', 'string', 'min:4', 'max:100'],
            'description' => ['nullable', 'string', 'max:2000'],
            'tagline' => ['nullable', 'string', 'max:200'],
            'cover_image_url' => ['nullable', 'string', 'max:1000'],
            'theme' => ['nullable', Rule::in(['classic', 'modern', 'cinematic', 'minimal', 'luxury', 'traditional'])],
            'status' => ['nullable', Rule::in(['active', 'disabled', 'draft'])],
            'allow_download' => ['nullable', 'boolean'],
            'allow_share' => ['nullable', 'boolean'],
            'expires_at' => ['nullable', 'date'],
        ];
    }
}
