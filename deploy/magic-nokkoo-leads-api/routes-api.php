<?php

// Create this as  ~/magic.nokkoo.in/routes/api.php
// (and add  api: __DIR__.'/../routes/api.php',  to withRouting() in
//  bootstrap/app.php — see INSTALL.txt STEP 2b).

use App\Http\Controllers\Api\LeadApiController;
use Illuminate\Support\Facades\Route;

// POST /api/leads  — token-protected intake for forwarded album enquiries.
Route::post('/leads', [LeadApiController::class, 'store']);
