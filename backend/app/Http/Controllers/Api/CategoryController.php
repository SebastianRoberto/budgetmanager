<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Listar categorías del usuario
     */
    public function index(Request $request): JsonResponse
    {
        $categories = Category::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Crear nueva categoría
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'monthly_limit' => $request->monthly_limit,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Categoría creada exitosamente',
            'data' => $category,
        ], 201);
    }

    /**
     * Actualizar categoría
     */
    public function update(StoreCategoryRequest $request, int $id): JsonResponse
    {
        $category = Category::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $category->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Categoría actualizada exitosamente',
            'data' => $category,
        ]);
    }

    /**
     * Eliminar categoría
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $category = Category::where('user_id', $request->user()->id)
            ->findOrFail($id);

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Categoría eliminada exitosamente',
        ]);
    }
}

