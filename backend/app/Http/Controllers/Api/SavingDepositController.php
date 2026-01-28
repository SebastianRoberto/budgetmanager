<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSavingDepositRequest;
use App\Models\SavingDeposit;
use App\Models\SavingGoal;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SavingDepositController extends Controller
{
    /**
     * Listar depósitos de una meta
     */
    public function index(Request $request, int $goalId): JsonResponse
    {
        // Verificar que la meta pertenece al usuario
        $goal = SavingGoal::where('user_id', $request->user()->id)
            ->findOrFail($goalId);

        $deposits = SavingDeposit::where('goal_id', $goalId)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $deposits,
        ]);
    }

    /**
     * Crear nuevo depósito
     */
    public function store(StoreSavingDepositRequest $request, int $goalId): JsonResponse
    {
        // Verificar que la meta pertenece al usuario
        $goal = SavingGoal::where('user_id', $request->user()->id)
            ->findOrFail($goalId);

        DB::beginTransaction();
        try {
            $deposit = SavingDeposit::create([
                'goal_id' => $goalId,
                'amount' => $request->amount,
                'date' => $request->date,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Depósito creado exitosamente',
                'data' => $deposit,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al crear el depósito',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Eliminar depósito
     */
    public function destroy(Request $request, int $goalId, int $id): JsonResponse
    {
        // Verificar que la meta pertenece al usuario
        $goal = SavingGoal::where('user_id', $request->user()->id)
            ->findOrFail($goalId);

        $deposit = SavingDeposit::where('goal_id', $goalId)
            ->findOrFail($id);

        $deposit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Depósito eliminado exitosamente',
        ]);
    }
}

