<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSavingGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:150'],
            'target_amount' => ['required', 'numeric', 'min:0.01'],
            'deadline' => ['required', 'date', 'after:today'],
        ];
    }
}

