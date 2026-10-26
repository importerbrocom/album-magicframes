<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Password-reset email that links to the React SPA reset page (not a Laravel
 * web route), since this app is an API + separately-served SPA.
 */
class ResetPasswordNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $base = rtrim((string) config('services.album.public_base_url'), '/');
        $url = $base . '/admin/reset-password?token=' . $this->token
            . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        $expire = config('auth.passwords.users.expire', 60);

        return (new MailMessage)
            ->subject('Reset your Magic Frames password')
            ->greeting('Password reset')
            ->line('We received a request to reset the password for your account.')
            ->action('Reset Password', $url)
            ->line("This link will expire in {$expire} minutes.")
            ->line('If you did not request a password reset, no action is required.');
    }
}
