<?php

namespace App\Jobs;

use App\Models\Enquiry;
use App\Services\CrnService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Delivers an enquiry to the CRN system in the background so the visitor's
 * submit request returns immediately. Retries a few times on transient
 * failures.
 */
class ForwardEnquiryToCrn implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [10, 60, 300];

    public function __construct(public int $enquiryId)
    {
    }

    public function handle(CrnService $crn): void
    {
        $enquiry = Enquiry::find($this->enquiryId);
        if ($enquiry) {
            $crn->forward($enquiry);
        }
    }
}
