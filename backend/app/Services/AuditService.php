<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Central writer for the security / staff-management audit trail. Snapshots the
 * actor's name+email so the record stays meaningful even if the user is later
 * deleted.
 */
class AuditService
{
    public function log(
        ?User $actor,
        string $action,
        ?object $target = null,
        array $meta = [],
        ?Request $request = null,
    ): AuditLog {
        $request ??= request();

        return AuditLog::create([
            'actor_id' => $actor?->id,
            'actor_name' => $actor?->name,
            'actor_email' => $actor?->email,
            'action' => $action,
            'target_type' => $target ? class_basename($target) : null,
            'target_id' => $target->id ?? null,
            'target_label' => $this->labelFor($target),
            'ip_address' => $request?->ip(),
            'user_agent' => $request ? substr((string) $request->userAgent(), 0, 255) : null,
            'meta' => $meta ?: null,
        ]);
    }

    private function labelFor(?object $target): ?string
    {
        if (! $target) {
            return null;
        }

        return $target->email ?? $target->name ?? (string) ($target->id ?? '');
    }
}
