<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Psr\Http\Message\StreamInterface;

/**
 * Thin, dependency-free wrapper around the Google Drive REST API v3.
 *
 * Responsibilities (per spec section 6):
 *  - Extract/validate folder IDs from Drive URLs
 *  - List child folders and image files, with pagination
 *  - Provide thumbnail / preview / original URL derivations
 *  - Handle auth in two modes: public API key, or OAuth refresh token
 *  - Handle rate limits, transient errors and inaccessible folders gracefully
 *
 * This service NEVER leaks credentials to the client; it is only ever called
 * from Laravel (controllers / queued jobs).
 */
class GoogleDriveService
{
    private const FOLDER_MIME = 'application/vnd.google-apps.folder';

    private const SUPPORTED_IMAGE_MIMES = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
    ];

    private const API_BASE = 'https://www.googleapis.com/drive/v3';
    private const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private Client $http;

    public function __construct(?Client $http = null)
    {
        $this->http = $http ?? new Client([
            'timeout' => 30,
            'connect_timeout' => 10,
        ]);
    }

    /** Whether any usable Drive credentials are configured. */
    public function isConfigured(): bool
    {
        return $this->authMode() === 'oauth'
            ? (bool) config('services.google_drive.refresh_token')
            : (bool) config('services.google_drive.api_key');
    }

    public function authMode(): string
    {
        return config('services.google_drive.auth_mode', 'api_key');
    }

    /**
     * Extract a Drive folder ID from any of the common URL shapes:
     *   https://drive.google.com/drive/folders/<ID>
     *   https://drive.google.com/drive/u/0/folders/<ID>
     *   https://drive.google.com/open?id=<ID>
     *   https://drive.google.com/drive/folders/<ID>?usp=sharing
     * A bare ID is also accepted.
     */
    public function extractFolderId(string $input): string
    {
        $input = trim($input);

        if ($input === '') {
            throw GoogleDriveException::invalidUrl('Empty folder link.');
        }

        // Bare ID (Drive IDs are URL-safe base64-ish, >= 10 chars, no slash).
        if (preg_match('/^[A-Za-z0-9_-]{10,}$/', $input)) {
            return $input;
        }

        if (preg_match('#/folders/([A-Za-z0-9_-]+)#', $input, $m)) {
            return $m[1];
        }

        if (preg_match('#[?&]id=([A-Za-z0-9_-]+)#', $input, $m)) {
            return $m[1];
        }

        throw GoogleDriveException::invalidUrl("Could not parse folder id from: {$input}");
    }

    /** Fetch metadata for a single folder; validates accessibility. */
    public function getFolderMetadata(string $folderId): array
    {
        $data = $this->request('GET', "/files/{$folderId}", [
            'query' => array_filter([
                'fields' => 'id,name,mimeType,trashed',
                'supportsAllDrives' => 'true',
            ]),
        ]);

        if (($data['mimeType'] ?? null) !== self::FOLDER_MIME) {
            throw GoogleDriveException::invalidUrl('The provided Drive link is not a folder.');
        }

        if ($data['trashed'] ?? false) {
            throw GoogleDriveException::notFound('Folder is in trash.');
        }

        return $data;
    }

    /** Validate a folder is reachable; returns its metadata. */
    public function validateFolder(string $folderId): array
    {
        return $this->getFolderMetadata($folderId);
    }

    /**
     * List immediate child folders of a given folder (all pages).
     *
     * @return array<int,array{id:string,name:string}>
     */
    public function listChildFolders(string $parentId): array
    {
        return $this->listChildren(
            $parentId,
            "mimeType = '" . self::FOLDER_MIME . "'",
            'id,name',
        );
    }

    /**
     * List immediate image files inside a folder (all pages).
     *
     * @return array<int,array<string,mixed>>
     */
    public function listImageFiles(string $parentId): array
    {
        $mimeClause = collect(self::SUPPORTED_IMAGE_MIMES)
            ->map(fn ($m) => "mimeType = '{$m}'")
            ->implode(' or ');

        return $this->listChildren(
            $parentId,
            "({$mimeClause})",
            'id,name,mimeType,size,imageMediaMetadata(width,height),thumbnailLink,createdTime',
        );
    }

    /**
     * Generic paginated listing of children matching an extra query clause.
     *
     * @return array<int,array<string,mixed>>
     */
    private function listChildren(string $parentId, string $extraQuery, string $fileFields): array
    {
        $items = [];
        $pageToken = null;

        do {
            $query = array_filter([
                'q' => "'{$parentId}' in parents and trashed = false and ({$extraQuery})",
                'fields' => "nextPageToken, files({$fileFields})",
                'pageSize' => 1000,
                'orderBy' => 'name_natural',
                'supportsAllDrives' => 'true',
                'includeItemsFromAllDrives' => 'true',
                'pageToken' => $pageToken,
            ], fn ($v) => $v !== null);

            $data = $this->request('GET', '/files', ['query' => $query]);

            foreach ($data['files'] ?? [] as $file) {
                $items[] = $file;
            }

            $pageToken = $data['nextPageToken'] ?? null;
        } while ($pageToken);

        return $items;
    }

    /**
     * Open a readable stream for a file's binary content (for authorized downloads).
     * Only used server-side by the download proxy.
     */
    public function downloadStream(string $fileId): StreamInterface
    {
        $response = $this->rawRequest('GET', "/files/{$fileId}", [
            'query' => array_filter([
                'alt' => 'media',
                'supportsAllDrives' => 'true',
            ]),
            'stream' => true,
        ]);

        return $response->getBody();
    }

    // --- URL derivation helpers -------------------------------------------------

    /**
     * Build a resized thumbnail URL from Drive's thumbnailLink.
     * Drive thumbnail links end with "=s220"; we swap the size suffix.
     */
    public function thumbnailUrl(?string $thumbnailLink, int $size = 400): ?string
    {
        if (! $thumbnailLink) {
            return null;
        }

        return preg_replace('/=s\d+(-c)?$/', "=s{$size}", $thumbnailLink)
            ?? $thumbnailLink;
    }

    /** A medium "preview" sized image for the full-screen viewer. */
    public function previewUrl(?string $thumbnailLink, int $size = 1600): ?string
    {
        return $this->thumbnailUrl($thumbnailLink, $size);
    }

    // --- HTTP plumbing ----------------------------------------------------------

    private function request(string $method, string $path, array $options = []): array
    {
        $response = $this->rawRequest($method, $path, $options);
        $body = (string) $response->getBody();

        return $body === '' ? [] : (json_decode($body, true) ?? []);
    }

    private function rawRequest(string $method, string $path, array $options = [], int $attempt = 1)
    {
        if (! $this->isConfigured()) {
            throw GoogleDriveException::notConfigured('No Drive credentials configured.');
        }

        $options = $this->applyAuth($options);

        try {
            return $this->http->request($method, self::API_BASE . $path, $options);
        } catch (ClientException $e) {
            $status = $e->getResponse()?->getStatusCode();

            // Rate limited / transient: exponential backoff then retry.
            if (in_array($status, [429, 500, 502, 503], true) && $attempt <= 4) {
                $delay = (int) (pow(2, $attempt - 1) * 500_000); // 0.5s, 1s, 2s, 4s
                usleep($delay);

                return $this->rawRequest($method, $path, $options, $attempt + 1);
            }

            if ($status === 401) {
                // OAuth token likely expired; clear cache so it refreshes next call.
                Cache::forget('gdrive.access_token');
                throw GoogleDriveException::notAccessible('Google Drive permission has changed (401).');
            }

            if ($status === 403) {
                throw GoogleDriveException::notAccessible('Access forbidden (403).');
            }

            if ($status === 404) {
                throw GoogleDriveException::notFound('Resource not found (404).');
            }

            Log::warning('Google Drive API client error', ['status' => $status, 'path' => $path]);
            throw GoogleDriveException::cannotConnect("HTTP {$status} from Drive API.");
        } catch (ConnectException $e) {
            if ($attempt <= 3) {
                usleep((int) (pow(2, $attempt - 1) * 500_000));

                return $this->rawRequest($method, $path, $options, $attempt + 1);
            }
            throw GoogleDriveException::cannotConnect($e->getMessage());
        } catch (GuzzleException $e) {
            throw GoogleDriveException::cannotConnect($e->getMessage());
        }
    }

    private function applyAuth(array $options): array
    {
        if ($this->authMode() === 'oauth') {
            $token = $this->accessToken();
            $options['headers']['Authorization'] = "Bearer {$token}";

            return $options;
        }

        // API key mode: append key to query string.
        $options['query'] = array_merge(
            $options['query'] ?? [],
            ['key' => config('services.google_drive.api_key')],
        );

        return $options;
    }

    /** Exchange the long-lived refresh token for a cached short-lived access token. */
    private function accessToken(): string
    {
        return Cache::remember('gdrive.access_token', now()->addMinutes(50), function () {
            $clientId = config('services.google_drive.client_id');
            $clientSecret = config('services.google_drive.client_secret');
            $refreshToken = config('services.google_drive.refresh_token');

            if (! $clientId || ! $clientSecret || ! $refreshToken) {
                throw GoogleDriveException::notConfigured('OAuth credentials incomplete.');
            }

            try {
                $response = $this->http->post(self::OAUTH_TOKEN_URL, [
                    'form_params' => [
                        'client_id' => $clientId,
                        'client_secret' => $clientSecret,
                        'refresh_token' => $refreshToken,
                        'grant_type' => 'refresh_token',
                    ],
                ]);
            } catch (GuzzleException $e) {
                throw GoogleDriveException::cannotConnect('Failed to refresh Google token: ' . $e->getMessage());
            }

            $data = json_decode((string) $response->getBody(), true) ?? [];

            if (empty($data['access_token'])) {
                throw GoogleDriveException::notAccessible('No access token returned by Google.');
            }

            return $data['access_token'];
        });
    }

    public static function supportedImageMimes(): array
    {
        return self::SUPPORTED_IMAGE_MIMES;
    }
}
