<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Studio-wide settings (admin only). Currently the global social media links
 * that appear on every public album.
 */
class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'social_links' => Setting::socialLinks(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'instagram' => ['nullable', 'url', 'max:1000'],
            'whatsapp' => ['nullable', 'url', 'max:1000'],
            'facebook' => ['nullable', 'url', 'max:1000'],
            'pinterest' => ['nullable', 'url', 'max:1000'],
        ]);

        Setting::put('social_instagram_url', $data['instagram'] ?? null);
        Setting::put('social_whatsapp_url', $data['whatsapp'] ?? null);
        Setting::put('social_facebook_url', $data['facebook'] ?? null);
        Setting::put('social_pinterest_url', $data['pinterest'] ?? null);

        return response()->json([
            'message' => 'Settings saved.',
            'social_links' => Setting::socialLinks(),
        ]);
    }
}
