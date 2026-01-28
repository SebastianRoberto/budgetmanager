<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDebtRequest;
use App\Models\Debt;
use App\Services\AlertService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DebtController extends Controller
{
    protected AlertService $alertService;

    public function __construct(AlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * Listar deudas del usuario
     */
    public function index(Request $request): JsonResponse
    {
        $query = Debt::where('user_id', $request->user()->id);

        // Filtrar por tipo si se especifica
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $debts = $query->orderBy('due_date', 'asc')->get();

        // Calcular días vencidos y actualizar status si es necesario
        $today = Carbon::today();
        foreach ($debts as $debt) {
            if ($debt->status !== 'paid' && $debt->due_date < $today) {
                $debt->status = 'late';
                $debt->save();
            }
        }

        return response()->json([
            'success' => true,
            'data' => $debts,
        ]);
    }

    /**
     * Crear nueva deuda
     */
    public function store(StoreDebtRequest $request): JsonResponse
    {
        $debt = Debt::create([
            'user_id' => $request->user()->id,
            'type' => $request->type,
            'person' => $request->person,
            'amount' => $request->amount,
            'due_date' => $request->due_date,
            'status' => $request->status ?? 'pending',
            'description' => $request->description,
        ]);

        // Verificar si está vencida
        $this->alertService->checkDebtAlerts($request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Deuda creada exitosamente',
            'data' => $debt,
        ], 201);
    }

    /**
     * Actualizar deuda
     */
    public function update(StoreDebtRequest $request, int $id): JsonResponse
    {
        $debt = Debt::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $debt->update($request->validated());

        // Verificar alertas
        $this->alertService->checkDebtAlerts($request->user()->id);

        return response()->json([
            'success' => true,
            'message' => 'Deuda actualizada exitosamente',
            'data' => $debt,
        ]);
    }

    /**
     * Eliminar deuda
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $debt = Debt::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $debt->delete();

        return response()->json([
            'success' => true,
            'message' => 'Deuda eliminada exitosamente',
        ]);
    }
}

