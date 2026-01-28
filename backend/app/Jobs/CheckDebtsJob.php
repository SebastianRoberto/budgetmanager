<?php

namespace App\Jobs;

use App\Services\AlertService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class CheckDebtsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(AlertService $alertService): void
    {
        // Obtener todos los usuarios activos
        $userIds = DB::table('users')->pluck('id');

        foreach ($userIds as $userId) {
            $alertService->checkDebtAlerts($userId);
        }
    }
}

