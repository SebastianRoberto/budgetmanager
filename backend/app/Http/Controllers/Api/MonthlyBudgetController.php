<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMonthlyBudgetRequest;
use App\Models\MonthlyBudget;
use App\Models\Transaction;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthlyBudgetController extends Controller
{
    protected AlertService $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * Obtener presupuesto del mes
     */
    public function show(Request $request): JsonResponse
    {
        $request->validate([
            'month' => ['required', 'integer', 'min:1', 'max:12'],
            'year' => ['required', 'integer', 'min:2000', 'max:2100'],
        ]);

        $budget = MonthlyBudget::where('user_id', $request->user()->id)
            ->where('month', $request->month)
            ->where('year', $request->year)
            ->first();

        // Calcular gasto acumulado del mes
        $totalExpenses = Transaction::where('user_id', $request->user()->id)
            ->where('type', 'expense')
            ->whereMonth('date', $request->month)
            ->whereYear('date', $request->year)
            ->sum('amount');

        $data = [
            'budget' => $budget,
            'total_expenses' => (float) $totalExpenses,
            'remaining' => $budget ? (float) ($budget->amount - $totalExpenses) : null,
            'percentage_used' => $budget && $budget->amount > 0 
                ? (float) (($totalExpenses / $budget->amount) * 100) 
                : null,
        ];

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    /**
     * Crear o actualizar presupuesto mensual
     */
    public function store(StoreMonthlyBudgetRequest $request): JsonResponse
    {
        $budget = MonthlyBudget::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'month' => $request->month,
                'year' => $request->year,
            ],
            [
                'amount' => $request->amount,
            ]
        );

        // Re-evaluar alertas del mes
        $this->alertService->checkMonthlyBudget(
            $request->user()->id,
            $request->month,
            $request->year
        );

        return response()->json([
            'success' => true,
            'message' => 'Presupuesto guardado exitosamente',
            'data' => $budget,
        ], 201);
    }
}

