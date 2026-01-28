# Guía de Instalación - Proyecto Angular

## Requisitos Previos

1. **Node.js 18+** instalado
   - Verificar: `node --version`
   - Descargar: https://nodejs.org/

2. **Angular CLI** instalado globalmente
   - Instalar: `npm install -g @angular/cli`
   - Verificar: `ng version`

## Crear el Proyecto Angular

Ejecuta estos comandos desde la raíz del proyecto:

```bash
cd frontend
ng new budget-manager --routing --style=scss --skip-git
```

Cuando pregunte:
- **Would you like to add Angular routing?** → Ya está con `--routing`
- **Which stylesheet format would you like to use?** → SCSS (ya está con `--style=scss`)

## Estructura del Proyecto

Después de crear el proyecto, la estructura será:

```
frontend/
  budget-manager/
    src/
      app/
        ... (aquí crearemos toda la estructura)
```

## Próximos Pasos

Una vez creado el proyecto, ejecutaremos:
1. Instalación de dependencias adicionales (Chart.js, etc.)
2. Creación de la estructura de carpetas completa
3. Configuración de servicios y modelos
4. Creación de componentes
5. Configuración de rutas y guards

---

**Nota:** Si ya tienes el proyecto creado, avísame y continuamos con la estructura de archivos.

