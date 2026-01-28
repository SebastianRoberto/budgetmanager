<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'payload',
        'is_read',
    ];

    protected $casts = [
        'payload' => 'array',
        'is_read' => 'boolean',
    ];

    /**
     * Tipos de alertas disponibles
     */
    const TYPE_BUDGET_EXCEEDED = 'budget_exceeded';
    const TYPE_CATEGORY_EXCEEDED = 'category_exceeded';
    const TYPE_DEBT_DUE = 'debt_due';
    const TYPE_GOAL_OFFTRACK = 'goal_offtrack';

    /**
     * Relación con el usuario propietario
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

