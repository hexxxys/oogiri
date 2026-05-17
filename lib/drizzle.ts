import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!_db) {
    // Remove channel_binding parameter which is not supported by the HTTP transport
    const url = process.env.DATABASE_URL!.replace(/[&?]channel_binding=[^&]*/g, '');
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}
