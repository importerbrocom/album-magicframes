<?php

namespace Tests\Unit;

use App\Services\GoogleDriveException;
use App\Services\GoogleDriveService;
use PHPUnit\Framework\TestCase;

class GoogleDriveServiceTest extends TestCase
{
    private GoogleDriveService $svc;

    protected function setUp(): void
    {
        parent::setUp();
        $this->svc = new GoogleDriveService();
    }

    public function test_extracts_id_from_folder_url(): void
    {
        $this->assertSame(
            '1ABCxyz_-890',
            $this->svc->extractFolderId('https://drive.google.com/drive/folders/1ABCxyz_-890'),
        );
    }

    public function test_extracts_id_with_sharing_suffix(): void
    {
        $this->assertSame(
            '1ABCxyz',
            $this->svc->extractFolderId('https://drive.google.com/drive/folders/1ABCxyz?usp=sharing'),
        );
    }

    public function test_extracts_id_from_open_url(): void
    {
        $this->assertSame(
            'ZZZ123abc',
            $this->svc->extractFolderId('https://drive.google.com/open?id=ZZZ123abc'),
        );
    }

    public function test_accepts_bare_id(): void
    {
        $this->assertSame('1ABCxyz_-890', $this->svc->extractFolderId('1ABCxyz_-890'));
    }

    public function test_rejects_invalid_url(): void
    {
        $this->expectException(GoogleDriveException::class);
        $this->svc->extractFolderId('not a drive link');
    }

    public function test_thumbnail_url_resizing(): void
    {
        $link = 'https://lh3.googleusercontent.com/abc=s220';
        $this->assertSame('https://lh3.googleusercontent.com/abc=s400', $this->svc->thumbnailUrl($link, 400));
        $this->assertSame('https://lh3.googleusercontent.com/abc=s1600', $this->svc->previewUrl($link, 1600));
    }
}
