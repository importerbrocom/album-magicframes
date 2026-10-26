<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Records important security + staff-management actions to the audit_logs
 * table. Captures a text snapshot of actor/target so the trail survives even
 * if those users are later deleted.
 */
class AuditLogger
{
    public function log(
        string $action,
        ?User $actor = null,
        ?User $target = null,
        array $meta = [],
        ?Request $request = null,
    ): AuditLog {
        return AuditLog::create([
            'actor_id' => $actor?->id,
            'actor_label' => $actor ? $this->label($actor) : null,
            'action' => $action,
            'target_id' => $target?->id,
            'target_label' => $target ? $this->label($target) : null,
            'meta' => $meta ?: null,
            'ip_address' => $request?->ip(),
            'user_agent' => $request ? substr((string) $request->userAgent(), 0, 500) : null,
        ]);
    }

    private function label(User $user): string
    {
        return trim("{$user->name} <{$user->email}>");
    }
}
