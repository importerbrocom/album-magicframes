<?php

namespace App\Http\Controllers\PublicAlbum;

use App\Http\Controllers\Controller;
use App\Models\Album;
use App\Services\AlbumService;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Response;

class QrController extends Controller
{
    public function __construct(private AlbumService $albums)
    {
    }

    /** Returns a PNG QR code encoding the album's public URL. */
    public function show(string $slug): Response
    {
        $album = Album::where('slug', $slug)->firstOrFail();

        $url = $this->albums->publicUrl($album);

        $result = (new Builder(
            writer: new PngWriter(),
            data: $url,
            encoding: new Encoding('UTF-8'),
            size: 420,
            margin: 16,
        ))->build();

        return response($result->getString(), 200, [
            'Content-Type' => $result->getMimeType(),
            'Cache-Control' => 'public, max-age=86400',
        ]);
    }
}
