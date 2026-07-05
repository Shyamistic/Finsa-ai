/**
 * Auto-migration module for Render / production deployments.
 * Runs schema.sql and migration files on startup if tables don't exist.
 * Safe to run multiple times — all statements use IF NOT EXISTS / IF NOT EXIST guards.
 */
import { pool } from './db';
import { logger } from '../lib/logger';
import * as fs from 'fs';
import * as path from 'path';

export async function runMigrations(): Promise<void> {
  try {
    // Test connection first
    await pool.query('SELECT 1');
    logger.info({ event: 'db_connection_ok' });
  } catch (err: any) {
    logger.error({ event: 'db_connection_failed', err: err.message });
    throw new Error(`Database connection failed: ${err.message}`);
  }

  try {
    // Check if base schema exists (sessions table is the indicator)
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      ) AS exists
    `);

    const schemaExists = tableCheck.rows[0]?.exists === true;

    if (!schemaExists) {
      logger.info({ event: 'db_schema_missing', action: 'running_base_schema' });
      const schemaPath = path.resolve(__dirname, 'schema.sql');
      
      // In production (compiled), schema.sql might be at dist/db/schema.sql
      // We need to handle both dev and prod paths
      let schemaSQL: string;
      if (fs.existsSync(schemaPath)) {
        schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
      } else {
        // Try relative to dist folder (production build)
        const altPath = path.resolve(process.cwd(), 'src/db/schema.sql');
        if (fs.existsSync(altPath)) {
          schemaSQL = fs.readFileSync(altPath, 'utf-8');
        } else {
          logger.warn({ event: 'db_schema_file_not_found', paths: [schemaPath, altPath] });
          return;
        }
      }

      await pool.query(schemaSQL);
      logger.info({ event: 'db_base_schema_applied' });
    } else {
      logger.info({ event: 'db_schema_exists', action: 'skipping_base_schema' });
    }

    // Run numbered migrations in order
    const migrationsDir = path.resolve(__dirname, 'migrations');
    let migrationFiles: string[] = [];

    if (fs.existsSync(migrationsDir)) {
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort(); // Alphabetical sort ensures numeric ordering (001_, 002_, etc.)
    } else {
      // Try production path
      const altMigrationsDir = path.resolve(process.cwd(), 'src/db/migrations');
      if (fs.existsSync(altMigrationsDir)) {
        migrationFiles = fs.readdirSync(altMigrationsDir)
          .filter(f => f.endsWith('.sql'))
          .sort();
      }
    }

    for (const file of migrationFiles) {
      const filePath = fs.existsSync(path.resolve(migrationsDir, file))
        ? path.resolve(migrationsDir, file)
        : path.resolve(process.cwd(), 'src/db/migrations', file);

      logger.info({ event: 'db_running_migration', file });
      const sql = fs.readFileSync(filePath, 'utf-8');
      await pool.query(sql);
      logger.info({ event: 'db_migration_applied', file });
    }

    logger.info({ event: 'db_migrations_complete', migrations: migrationFiles.length });
  } catch (err: any) {
    logger.error({ event: 'db_migration_error', err: err.message });
    // Don't crash the server — log and continue
    // The app will fail on individual queries if schema is missing
  }
}
