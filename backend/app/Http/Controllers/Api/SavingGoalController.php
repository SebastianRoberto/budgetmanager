<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSavingGoalRequest;
use App\Models\SavingGoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingGoalController extends Controller
{
    /**
     * Listar metas de ahorro del usuario
     */
    public function index(Request $request): JsonResponse
    {
        $goals = SavingGoal::where('user_id', $request->user()->id)
            ->with('deposits')
            ->orderBy('deadline', 'asc')
            ->get();

        // Calcular progreso para cada meta
        $goals->each(function ($goal) {
            $goal->total_saved = $goal->total_saved;
            $goal->progress_percentage = $goal->progress_percentage;
        });

        return response()->json([
            'success' => true,
            'data' => $goals,
        ]);
    }

    /**
     * Crear nueva meta de ahorro
     */
    public function store(StoreSavingGoalRequest $request): JsonResponse
    {
        $goal = SavingGoal::create([
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'target_amount' => $request->target_amount,
            'deadline' => $request->deadline,
        ]);

        $goal->load('deposits');

        return response()->json([
            'success' => true,
            'message' => 'Meta de ahorro creada exitosamente',
            'data' => $goal,
        ], 201);
    }

    /**
     * Obtener meta específica
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $goal = SavingGoal::where('user_id', $request->user()->id)
            ->with('deposits')
            ->findOrFail($id);

        $goal->total_saved = $goal->total_saved;
        $goal->progress_percentage = $goal->progress_percentage;

        return response()->json([
            'success' => true,
            'data' => $goal,
        ]);
    }

    /**
     * Actualizar meta de ahorro
     */
    public function update(StoreSavingGoalRequest $request, int $id): JsonResponse
    {
        $goal = SavingGoal::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $goal->update($request->validated());
        $goal->load('deposits');

        return response()->json([
            'success' => true,
            'message' => 'Meta de ahorro actualizada exitosamente',
            'data' => $goal,
        ]);
    }

    /**
     * Eliminar meta de ahorro
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $goal = SavingGoal::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $goal->delete();

        return response()->json([
            'success' => true,
            'message' => 'Meta de ahorro eliminada exitosamente',
        ]);
    }

    /**
     * Obtener progreso detallado de una meta
     */
    public function progress(Request $request, int $id): JsonResponse
    {
        $goal = SavingGoal::where('user_id', $request->user()->id)
            ->with('deposits')
            ->findOrFail($id);

        $totalSaved = $goal->total_saved;
        $progressPercentage = $goal->progress_percentage;
        
        // Calcular días restantes
        $today = now();
        $deadline = \Carbon\Carbon::parse($goal->deadline);
        $daysRemaining = $today->diffInDays($deadline, false); // false para obtener números negativos si ya pasó
        
        // Determinar si está atrasada
        $isOverdue = $daysRemaining < 0 && $progressPercentage < 100;
        
        return response()->json([
            'success' => true,
            'data' => [
                'goal' => $goal,
                'total_saved' => $totalSaved,
                'progress_percentage' => $progressPercentage,
                'days_remaining' => (int) $daysRemaining,
                'is_overdue' => $isOverdue,
            ],
        ]);
    }
}

