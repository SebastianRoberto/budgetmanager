<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Listar alertas del usuario
     */
    public function index(Request $request): JsonResponse
    {
        $query = Alert::where('user_id', $request->user()->id);

        // Filtrar por estado de lectura
        if ($request->has('is_read')) {
            $query->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
        }

        $alerts = $query->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $alerts,
        ]);
    }

    /**
     * Marcar alerta como leída
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $alert = Alert::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $alert->update(['is_read' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Alerta marcada como leída',
            'data' => $alert,
        ]);
    }
}

