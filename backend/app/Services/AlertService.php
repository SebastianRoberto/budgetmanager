<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Category;
use App\Models\Debt;
use App\Models\MonthlyBudget;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AlertService
{
    /**
     * Verifica y crea alertas después de crear/editar/eliminar una transacción
     */
    public function checkTransactionAlerts(Transaction $transaction): void
    {
        $user = $transaction->user;
        $date = Carbon::parse($transaction->date);
        $month = $date->month;
        $year = $date->year;

        // Verificar presupuesto mensual
        $this->checkMonthlyBudget($user->id, $month, $year);

        // Verificar límite de categoría (solo para gastos)
        if ($transaction->type === 'expense' && $transaction->category_id) {
            $this->checkCategoryLimit($user->id, $transaction->category_id, $month, $year);
        }
    }

    /**
     * Verifica si se superó el presupuesto mensual
     */
    public function checkMonthlyBudget(int $userId, int $month, int $year): void
    {
        $budget = MonthlyBudget::where('user_id', $userId)
            ->where('month', $month)
            ->where('year', $year)
            ->first();

        if (!$budget) {
            return;
        }

        // Calcular total de gastos del mes
        $totalExpenses = Transaction::where('user_id', $userId)
            ->where('type', 'expense')
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        // Verificar si se superó
        if ($totalExpenses > $budget->amount) {
            // Verificar si ya existe una alerta similar sin leer
            $existingAlert = Alert::where('user_id', $userId)
                ->where('type', Alert::TYPE_BUDGET_EXCEEDED)
                ->where('is_read', false)
                ->whereJsonContains('payload->month', $month)
                ->whereJsonContains('payload->year', $year)
                ->first();

            if (!$existingAlert) {
                Alert::create([
                    'user_id' => $userId,
                    'type' => Alert::TYPE_BUDGET_EXCEEDED,
                    'payload' => [
                        'month' => $month,
                        'year' => $year,
                        'total' => $totalExpenses,
                        'limit' => $budget->amount,
                    ],
                    'is_read' => false,
                ]);
            }
        } else {
            // Si ya no se supera, marcar alertas relacionadas como leídas
            Alert::where('user_id', $userId)
                ->where('type', Alert::TYPE_BUDGET_EXCEEDED)
                ->where('is_read', false)
                ->whereJsonContains('payload->month', $month)
                ->whereJsonContains('payload->year', $year)
                ->update(['is_read' => true]);
        }
    }

    /**
     * Verifica si se superó el límite de una categoría
     */
    protected function checkCategoryLimit(int $userId, int $categoryId, int $month, int $year): void
    {
        $category = Category::where('user_id', $userId)
            ->find($categoryId);

        if (!$category || !$category->monthly_limit) {
            return;
        }

        // Calcular total de gastos de la categoría en el mes
        $totalExpenses = Transaction::where('user_id', $userId)
            ->where('type', 'expense')
            ->where('category_id', $categoryId)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        // Verificar si se superó
        if ($totalExpenses > $category->monthly_limit) {
            // Verificar si ya existe una alerta similar sin leer
            $existingAlert = Alert::where('user_id', $userId)
                ->where('type', Alert::TYPE_CATEGORY_EXCEEDED)
                ->where('is_read', false)
                ->whereJsonContains('payload->category_id', $categoryId)
                ->whereJsonContains('payload->month', $month)
                ->whereJsonContains('payload->year', $year)
                ->first();

            if (!$existingAlert) {
                Alert::create([
                    'user_id' => $userId,
                    'type' => Alert::TYPE_CATEGORY_EXCEEDED,
                    'payload' => [
                        'category_id' => $categoryId,
                        'category_name' => $category->name,
                        'month' => $month,
                        'year' => $year,
                        'total' => $totalExpenses,
                        'limit' => $category->monthly_limit,
                    ],
                    'is_read' => false,
                ]);
            }
        } else {
            // Si ya no se supera, marcar alertas relacionadas como leídas
            Alert::where('user_id', $userId)
                ->where('type', Alert::TYPE_CATEGORY_EXCEEDED)
                ->where('is_read', false)
                ->whereJsonContains('payload->category_id', $categoryId)
                ->whereJsonContains('payload->month', $month)
                ->whereJsonContains('payload->year', $year)
                ->update(['is_read' => true]);
        }
    }

    /**
     * Verifica deudas vencidas y crea alertas
     */
    public function checkDebtAlerts(int $userId): void
    {
        $today = Carbon::today();

        $debts = Debt::where('user_id', $userId)
            ->where('status', '!=', 'paid')
            ->where('due_date', '<', $today)
            ->get();

        foreach ($debts as $debt) {
            // Marcar como late si no lo está
            if ($debt->status !== 'late') {
                $debt->update(['status' => 'late']);
            }

            // Crear alerta si no existe
            $existingAlert = Alert::where('user_id', $userId)
                ->where('type', Alert::TYPE_DEBT_DUE)
                ->where('is_read', false)
                ->whereJsonContains('payload->debt_id', $debt->id)
                ->first();

            if (!$existingAlert) {
                Alert::create([
                    'user_id' => $userId,
                    'type' => Alert::TYPE_DEBT_DUE,
                    'payload' => [
                        'debt_id' => $debt->id,
                        'person' => $debt->person,
                        'amount' => $debt->amount,
                        'due_date' => $debt->due_date->format('Y-m-d'),
                    ],
                    'is_read' => false,
                ]);
            }
        }
    }
}

