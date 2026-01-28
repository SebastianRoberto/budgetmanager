<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SavingGoal extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'target_amount',
        'deadline',
    ];

    protected $casts = [
        'target_amount' => 'decimal:2',
        'deadline' => 'date',
    ];

    /**
     * Relación con el usuario propietario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con los depósitos
     */
    public function deposits(): HasMany
    {
        return $this->hasMany(SavingDeposit::class, 'goal_id');
    }

    /**
     * Calcular el total ahorrado
     */
    public function getTotalSavedAttribute(): float
    {
        return $this->deposits()->sum('amount');
    }

    /**
     * Calcular el porcentaje de progreso
     */
    public function getProgressPercentageAttribute(): float
    {
        if ($this->target_amount == 0) {
            return 0;
        }
        return min(100, ($this->total_saved / $this->target_amount) * 100);
    }
}

