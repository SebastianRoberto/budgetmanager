<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SavingGoal;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Obtener datos del dashboard
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $now = Carbon::now();
        $month = $now->month;
        $year = $now->year;

        // Calcular saldo actual (ingresos - gastos del mes actual)
        $totalIncome = Transaction::where('user_id', $user->id)
            ->where('type', 'income')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        $totalExpense = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        $balance = $totalIncome - $totalExpense;

        // Gastos por categoría del mes actual
        $expensesByCategory = Transaction::where('user_id', $user->id)
            ->where('type', 'expense')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->whereNotNull('category_id')
            ->with('category')
            ->get()
            ->groupBy('category_id')
            ->map(function ($transactions) {
                return [
                    'category' => $transactions->first()->category,
                    'total' => (float) $transactions->sum('amount'),
                ];
            })
            ->values();

        // Meta activa más cercana
        $activeGoal = SavingGoal::where('user_id', $user->id)
            ->where('deadline', '>=', $now->toDateString())
            ->with('deposits')
            ->orderBy('deadline', 'asc')
            ->first();

        $goalData = null;
        if ($activeGoal) {
            $goalData = [
                'id' => $activeGoal->id,
                'title' => $activeGoal->title,
                'target_amount' => (float) $activeGoal->target_amount,
                'total_saved' => (float) $activeGoal->total_saved,
                'progress_percentage' => (float) $activeGoal->progress_percentage,
                'deadline' => $activeGoal->deadline->format('Y-m-d'),
                'days_remaining' => $now->diffInDays($activeGoal->deadline, false),
            ];
        }

        // Alertas recientes (últimas 5 sin leer)
        $recentAlerts = $user->alerts()
            ->where('is_read', false)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => (float) $balance,
                'monthly_income' => (float) $totalIncome,
                'monthly_expense' => (float) $totalExpense,
                'expenses_by_category' => $expensesByCategory,
                'active_goal' => $goalData,
                'recent_alerts' => $recentAlerts,
            ],
        ]);
    }
}

