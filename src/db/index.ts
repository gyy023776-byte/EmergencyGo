import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    const hasHost = Boolean(process.env.SQL_HOST);
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST || '127.0.0.1',
      user: process.env.SQL_USER || 'postgres',
      password: process.env.SQL_PASSWORD || '',
      database: process.env.SQL_DB_NAME || 'postgres',
      max: hasHost ? 10 : 1,
      connectionTimeoutMillis: hasHost ? 5000 : 500,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err: any) => {
      if (hasHost) {
        console.warn('[Database Pool] Idle client note:', err.message);
      }
      // If no SQL_HOST was specified, suppress noise
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
