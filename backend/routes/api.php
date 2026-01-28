<?php

use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\MonthlyBudgetController;
use App\Http\Controllers\Api\SavingDepositController;
use App\Http\Controllers\Api\SavingGoalController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rutas públicas de autenticación
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Rutas protegidas con autenticación Sanctum
Route::middleware('auth:sanctum')->group(function () {
    // Obtener usuario autenticado
    Route::get('/user', function (Request $request) {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
        ]);
    });

    // Autenticación
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Transacciones
    Route::apiResource('transactions', TransactionController::class);

    // Categorías
    Route::apiResource('categories', CategoryController::class);

    // Presupuesto mensual
    Route::prefix('monthly-budget')->group(function () {
        Route::get('/', [MonthlyBudgetController::class, 'show']);
        Route::post('/', [MonthlyBudgetController::class, 'store']);
    });

    // Deudas
    Route::apiResource('debts', DebtController::class);

    // Metas de ahorro
    Route::apiResource('goals', SavingGoalController::class);
    Route::get('goals/{id}/progress', [SavingGoalController::class, 'progress']);

    // Depósitos de metas
    Route::prefix('goals/{goalId}/deposits')->group(function () {
        Route::get('/', [SavingDepositController::class, 'index']);
        Route::post('/', [SavingDepositController::class, 'store']);
        Route::delete('/{id}', [SavingDepositController::class, 'destroy']);
    });

    // Alertas
    Route::prefix('alerts')->group(function () {
        Route::get('/', [AlertController::class, 'index']);
        Route::put('/{id}/read', [AlertController::class, 'markAsRead']);
    });

    // Ajustes
    Route::prefix('settings')->group(function () {
        Route::put('/profile', [SettingsController::class, 'updateProfile']);
        Route::put('/password', [SettingsController::class, 'changePassword']);
    });
});
