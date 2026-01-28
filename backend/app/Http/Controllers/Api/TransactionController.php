<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Models\Transaction;
use App\Services\AlertService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    protected AlertService $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * Listar transacciones con filtros
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::where('user_id', $request->user()->id)
            ->with('category');

        // Filtros
        if ($request->has('month')) {
            $query->whereMonth('date', $request->month);
        }
        if ($request->has('year')) {
            $query->whereYear('date', $request->year);
        }
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Calcular totales
        $totalIncome = (clone $query)->where('type', 'income')->sum('amount');
        $totalExpense = (clone $query)->where('type', 'expense')->sum('amount');

        // Paginación
        $perPage = $request->get('per_page', 15);
        $transactions = $query->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'last_page' => $transactions->lastPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
            ],
            'summary' => [
                'total_income' => (float) $totalIncome,
                'total_expense' => (float) $totalExpense,
                'balance' => (float) ($totalIncome - $totalExpense),
            ],
        ]);
    }

    /**
     * Crear nueva transacción
     */
    public function store(StoreTransactionRequest $request): JsonResponse
    {
        $transaction = Transaction::create([
            'user_id' => $request->user()->id,
            'type' => $request->type,
            'category_id' => $request->category_id,
            'amount' => $request->amount,
            'description' => $request->description,
            'date' => $request->date,
        ]);

        $transaction->load('category');

        // Verificar alertas si es un gasto
        if ($transaction->type === 'expense') {
            $this->alertService->checkTransactionAlerts($transaction);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transacción creada exitosamente',
            'data' => $transaction,
        ], 201);
    }

    /**
     * Obtener transacción específica
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $transaction = Transaction::where('user_id', $request->user()->id)
            ->with('category')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $transaction,
        ]);
    }

    /**
     * Actualizar transacción
     */
    public function update(UpdateTransactionRequest $request, int $id): JsonResponse
    {
        $transaction = Transaction::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $transaction->update($request->validated());
        $transaction->load('category');

        // Re-evaluar alertas
        $this->alertService->checkTransactionAlerts($transaction);

        return response()->json([
            'success' => true,
            'message' => 'Transacción actualizada exitosamente',
            'data' => $transaction,
        ]);
    }

    /**
     * Eliminar transacción
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $transaction = Transaction::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $date = $transaction->date;
        $transaction->delete();

        // Re-evaluar alertas del mes
        $month = (int) date('m', strtotime($date));
        $year = (int) date('Y', strtotime($date));
        $this->alertService->checkMonthlyBudget($request->user()->id, $month, $year);

        return response()->json([
            'success' => true,
            'message' => 'Transacción eliminada exitosamente',
        ]);
    }
}

