<?php

use App\Jobs\CheckDebtsJob;
use App\Jobs\CheckGoalsJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Programar jobs para ejecución automática
Schedule::job(new CheckDebtsJob)->dailyAt('00:00')->name('check-debts');
Schedule::job(new CheckGoalsJob)->weeklyOn(1, '00:00')->name('check-goals'); // Lunes a medianoche
