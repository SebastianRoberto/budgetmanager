<?php

namespace App\Jobs;

use App\Models\Alert;
use App\Models\SavingGoal;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckGoalsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $today = Carbon::today();
        
        // Obtener todas las metas activas (deadline en el futuro)
        $goals = SavingGoal::where('deadline', '>=', $today)
            ->with('deposits')
            ->get();

        foreach ($goals as $goal) {
            $this->checkGoalProgress($goal);
        }
    }

    /**
     * Verifica si una meta está fuera de ritmo
     */
    protected function checkGoalProgress(SavingGoal $goal): void
    {
        $today = Carbon::today();
        $deadline = Carbon::parse($goal->deadline);
        $createdAt = Carbon::parse($goal->created_at);
        
        // Calcular días totales y días transcurridos
        $totalDays = $createdAt->diffInDays($deadline);
        $daysElapsed = $createdAt->diffInDays($today);
        
        if ($totalDays <= 0 || $daysElapsed <= 0) {
            return;
        }

        // Calcular progreso esperado vs real
        $expectedProgress = ($daysElapsed / $totalDays) * 100;
        $actualProgress = $goal->progress_percentage;

        // Si el progreso real está más de 20% por debajo del esperado, crear alerta
        if ($actualProgress < ($expectedProgress - 20)) {
            // Verificar si ya existe una alerta similar sin leer
            $existingAlert = Alert::where('user_id', $goal->user_id)
                ->where('type', Alert::TYPE_GOAL_OFFTRACK)
                ->where('is_read', false)
                ->whereJsonContains('payload->goal_id', $goal->id)
                ->first();

            if (!$existingAlert) {
                Alert::create([
                    'user_id' => $goal->user_id,
                    'type' => Alert::TYPE_GOAL_OFFTRACK,
                    'payload' => [
                        'goal_id' => $goal->id,
                        'goal_title' => $goal->title,
                        'target_amount' => $goal->target_amount,
                        'total_saved' => $goal->total_saved,
                        'expected_progress' => round($expectedProgress, 2),
                        'actual_progress' => round($actualProgress, 2),
                        'deadline' => $goal->deadline->format('Y-m-d'),
                    ],
                    'is_read' => false,
                ]);
            }
        }
    }
}

