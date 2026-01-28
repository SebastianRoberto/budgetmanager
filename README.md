# 💰 Budget Manager

<div align="center">

**[🇪🇸 Español](#-español)** | **[🇬🇧 English](#-english)**

</div>

---

# 🇪🇸 Español

Aplicación para la gestión de finanzas personales con **Angular 18** (frontend) y **Laravel 11** (backend).

## ✨ Características

- 📊 Dashboard con resumen financiero
- 💳 Gestión de transacciones (ingresos/gastos)
- 📁 Categorías con límites opcionales
- 💵 Presupuesto mensual con barra de progreso visual
- 📋 Control de deudas
- 🎯 Metas de ahorro con historial de depósitos
- 🔔 Alertas inteligentes para límites y vencimientos
- 🌙 Modo oscuro/claro

---

## 🚀 Instalación Rápida

### Requisitos Previos

- **PHP 8.2+** con extensiones: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`
- **Composer** (gestor de paquetes PHP)
- **Node.js 18+** y **npm**
- **MySQL 8.0+**

---

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/SebastianRoberto/budgetmanager.git
cd budgetmanager
```

---

### 2️⃣ Configurar Base de Datos

```bash
cd backend
```

**Renombra el archivo `example.env` a `.env`:**

**Luego edita `.env`** y configura tus credenciales de MySQL:

```env
DB_DATABASE=budgetmanager
DB_USERNAME=root
DB_PASSWORD=tu_contraseña_mysql
```

---

### 3️⃣ Configurar Backend (Laravel)

```bash
# Instalar dependencias PHP
composer install

# Generar clave de aplicación
php artisan key:generate

# 🚀 SETUP AUTOMÁTICO - Crea la base de datos y ejecuta migraciones
php artisan app:setup

# Iniciar servidor backend
php artisan serve
```

> **Nota:** El comando `app:setup` automáticamente:
> 1. Verifica si la base de datos existe
> 2. Crea la base de datos si no existe
> 3. Ejecuta todas las migraciones para crear las tablas

El backend correrá en: `http://localhost:8000`

---

### 4️⃣ Configurar Frontend (Angular)

Abre una **nueva terminal** y ejecuta:

```bash
cd frontend/budget-manager

# Instalar dependencias Node
npm install

# Iniciar servidor de desarrollo
ng serve
```

El frontend correrá en: `http://localhost:4200`

---

## 📝 Base de Datos

La aplicación usa MySQL. El comando `php artisan app:setup` crea automáticamente:

| Tabla | Descripción |
|-------|-------------|
| `users` | Cuentas de usuario |
| `categories` | Categorías con límites opcionales |
| `transactions` | Ingresos y gastos |
| `monthly_budgets` | Presupuestos mensuales |
| `debts` | Control de deudas |
| `goals` | Metas de ahorro |
| `goal_deposits` | Depósitos hacia metas |
| `alerts` | Notificaciones del sistema |

---

## 📁 Estructura del Proyecto

```
budgetmanager/
├── backend/           # Laravel 11 API
│   ├── app/
│   ├── database/migrations/
│   ├── routes/api.php
│   └── example.env    # Plantilla para .env
├── frontend/          # Angular 18 SPA
│   └── budget-manager/
│       └── src/app/
├── .gitignore
└── README.md
```

---

## 🛠️ Comandos de Desarrollo

### Backend

```bash
php artisan app:setup         # Setup completo (DB + migraciones)
php artisan migrate           # Ejecutar migraciones
php artisan migrate:rollback  # Revertir última migración
php artisan serve             # Iniciar servidor
```

### Frontend

```bash
ng serve                              # Servidor de desarrollo
ng build --configuration=production   # Build para producción
```

---
---

# 🇬🇧 English

A comprehensive personal finance management application built with **Angular 18** (frontend) and **Laravel 11** (backend).

## ✨ Features

- 📊 Dashboard with financial overview
- 💳 Transaction management (income/expenses)
- 📁 Category management with optional limits
- 💵 Monthly budget tracking with visual progress bar
- 📋 Debt management
- 🎯 Savings goals with deposit history
- 🔔 Smart alerts for limits and due dates
- 🌙 Dark/Light mode
---

## 🚀 Quick Start

### Prerequisites

- **PHP 8.2+** with extensions: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`
- **Composer** (PHP package manager)
- **Node.js 18+** and **npm**
- **MySQL 8.0+**

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/SebastianRoberto/budgetmanager.git
cd budgetmanager
```

---

### 2️⃣ Configure Database

```bash
cd backend
```

**Rename `example.env` to `.env`:**

- On Windows: `ren example.env .env`
- On Linux/Mac: `mv example.env .env`

**Then edit `.env`** and set your MySQL credentials:

```env
DB_DATABASE=budgetmanager
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

---

### 3️⃣ Setup Backend (Laravel)

```bash
# Install PHP dependencies
composer install

# Generate application key
php artisan key:generate

# 🚀 AUTOMATIC SETUP - Creates database and runs migrations
php artisan app:setup

# Start backend server
php artisan serve
```

> **Note:** The `app:setup` command will automatically:
> 1. Check if the database exists
> 2. Create the database if it doesn't exist
> 3. Run all migrations to create the tables

Backend will run at: `http://localhost:8000`

---

### 4️⃣ Setup Frontend (Angular)

Open a **new terminal** and run:

```bash
cd frontend/budget-manager

# Install Node dependencies
npm install

# Start development server
ng serve
```

Frontend will run at: `http://localhost:4200`

---

## 📝 Database

The application uses MySQL. The `php artisan app:setup` command automatically creates:

| Table | Description |
|-------|-------------|
| `users` | User accounts |
| `categories` | Categories with optional limits |
| `transactions` | Income and expenses |
| `monthly_budgets` | Monthly budget limits |
| `debts` | Debt tracking |
| `goals` | Savings goals |
| `goal_deposits` | Deposits towards goals |
| `alerts` | System notifications |

---

## 📁 Project Structure

```
budgetmanager/
├── backend/           # Laravel 11 API
│   ├── app/
│   ├── database/migrations/
│   ├── routes/api.php
│   └── example.env    # Template for .env
├── frontend/          # Angular 18 SPA
│   └── budget-manager/
│       └── src/app/
├── .gitignore
└── README.md
```

---

## 🛠️ Development Commands

### Backend

```bash
php artisan app:setup         # Full setup (DB + migrations)
php artisan migrate           # Run migrations
php artisan migrate:rollback  # Rollback last migration
php artisan serve             # Start server
```

### Frontend

```bash
ng serve                              # Development server
ng build --configuration=production   # Production build
```
