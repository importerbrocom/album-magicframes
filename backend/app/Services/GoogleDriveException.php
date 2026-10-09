<?php

namespace App\Services;

use RuntimeException;

/**
 * Domain-specific exception carrying a user-friendly message so controllers
 * and jobs can surface helpful text instead of raw API/HTTP errors.
 */
class GoogleDriveException extends RuntimeException
{
    public function __construct(
        public readonly string $userMessage,
        string $technicalMessage = '',
        public readonly ?int $statusCode = null,
    ) {
        parent::__construct($technicalMessage !== '' ? $technicalMessage : $userMessage);
    }

    public static function notAccessible(string $detail = ''): self
    {
        return new self(
            'The selected Google Drive folder is not accessible. Please connect Google Drive or update the folder sharing permissions.',
            $detail,
            403,
        );
    }

    public static function notFound(string $detail = ''): self
    {
        return new self(
            'The selected folder could not be found on Google Drive. It may have been moved or deleted.',
            $detail,
            404,
        );
    }

    public static function cannotConnect(string $detail = ''): self
    {
        return new self(
            'Unable to connect to Google Drive. Please try again.',
            $detail,
        );
    }

    public static function invalidUrl(string $detail = ''): self
    {
        return new self(
            'The Google Drive folder link is invalid. Please paste a valid Drive folder URL.',
            $detail,
            422,
        );
    }

    public static function notConfigured(string $detail = ''): self
    {
        return new self(
            'Google Drive is not configured on the server. Please add API credentials or connect an account.',
            $detail,
        );
    }
}
