import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { SCHEMA_SQL } from './schema';

let db: Database | null = null;
let sqlPromise: Promise<Database> | null = null;

const DB_KEY = 'church_finance_db';

function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
}

async function getDbPath(): Promise<string> {
  if (isTauri()) {
    try {
      const { appDataDir } = await import('@tauri-apps/api/path');
      const dir = await appDataDir();
      return `${dir}/church_finance.sqlite`;
    } catch {
      return DB_KEY;
    }
  }
  return DB_KEY;
}

async function loadFromStorage(): Promise<Uint8Array | null> {
  if (isTauri()) {
    try {
      const { readFile } = await import('@tauri-apps/plugin-fs');
      const path = await getDbPath();
      const data = await readFile(path);
      return new Uint8Array(data);
    } catch {
      return null;
    }
  }
  const stored = localStorage.getItem(DB_KEY);
  if (!stored) return null;
  const binary = atob(stored);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function saveToStorage(data: Uint8Array): Promise<void> {
  if (isTauri()) {
    try {
      const { writeFile, mkdir } = await import('@tauri-apps/plugin-fs');
      const { appDataDir } = await import('@tauri-apps/api/path');
      const dir = await appDataDir();
      await mkdir(dir, { recursive: true }).catch(() => {});
      const path = `${dir}/church_finance.sqlite`;
      await writeFile(path, data);
    } catch (err) {
      console.error('Failed to persist DB to disk:', err);
    }
    return;
  }
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < data.length; i += chunk) {
    binary += String.fromCharCode(...data.subarray(i, i + chunk));
  }
  localStorage.setItem(DB_KEY, btoa(binary));
}

export async function getDb(): Promise<Database> {
  if (db) return db;
  if (sqlPromise) return sqlPromise;

  sqlPromise = (async () => {
    const wasmUrl = new URL('sql.js/dist/sql-wasm.wasm', import.meta.url).href;
    const SQL: SqlJsStatic = await initSqlJs({ locateFile: () => wasmUrl });

    const existing = await loadFromStorage();
    db = existing ? new SQL.Database(existing) : new SQL.Database();

    if (!existing) {
      db.run(SCHEMA_SQL);
      await persist();
    } else {
      db.run('PRAGMA foreign_keys = ON;');
    }

    return db;
  })();

  return sqlPromise;
}

export async function persist(): Promise<void> {
  if (!db) return;
  const data = db.export();
  await saveToStorage(data);
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const database = await getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params as never[]);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<number> {
  const database = await getDb();
  database.run(sql, params as never[]);
  await persist();
  const result = database.exec('SELECT last_insert_rowid() as id');
  return result.length > 0 ? (result[0].values[0][0] as number) : 0;
}

export async function executeMany(sql: string, paramsList: unknown[][] = []): Promise<void> {
  const database = await getDb();
  for (const params of paramsList) {
    database.run(sql, params as never[]);
  }
  await persist();
}
