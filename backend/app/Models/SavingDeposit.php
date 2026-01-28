<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavingDeposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'goal_id',
        'amount',
        'date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    /**
     * Relación con la meta de ahorro
     */
    public function goal(): BelongsTo
    {
        return $this->belongsTo(SavingGoal::class, 'goal_id');
    }
}

