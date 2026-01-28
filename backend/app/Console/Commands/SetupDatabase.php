<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use PDO;
use PDOException;

class SetupDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Setup the application: create database if not exists and run migrations';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🚀 Budget Manager Setup');
        $this->newLine();

        // Get database config
        $host = config('database.connections.mysql.host');
        $port = config('database.connections.mysql.port');
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');

        $this->info("📦 Database: {$database}");
        $this->info("🌐 Host: {$host}:{$port}");
        $this->newLine();

        try {
            // Connect without selecting a database
            $pdo = new PDO(
                "mysql:host={$host};port={$port}",
                $username,
                $password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            // Check if database exists
            $stmt = $pdo->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '{$database}'");
            $exists = $stmt->fetch();

            if (!$exists) {
                $this->warn("⚠️  Database '{$database}' does not exist.");
                $this->info("📝 Creating database...");

                $pdo->exec("CREATE DATABASE `{$database}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

                $this->info("✅ Database '{$database}' created successfully!");
            } else {
                $this->info("✅ Database '{$database}' already exists.");
            }

            $this->newLine();
            $this->info("📋 Running migrations...");
            $this->newLine();

            // Run migrations
            $this->call('migrate', ['--force' => true]);

            $this->newLine();
            $this->info("🎉 Setup complete! You can now run: php artisan serve");
            $this->newLine();

            return Command::SUCCESS;

        } catch (PDOException $e) {
            $this->error("❌ Database connection failed!");
            $this->error("   Error: " . $e->getMessage());
            $this->newLine();
            $this->warn("Please check your .env file and ensure MySQL is running.");
            $this->warn("Make sure DB_USERNAME and DB_PASSWORD are correct.");

            return Command::FAILURE;
        }
    }
}
