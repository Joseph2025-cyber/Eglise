import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import { SCHEMA_SQL } from './schema';

let db: Database | null = null;
let sqlPromise: Promise<Database> | null = null;
let persistQueue: Promise<void> = Promise.resolve();
const DB_KEY = 'church_finance_db';
const DB_FILE = 'church_finance.sqlite';

function isTauri() {
  return typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
}

function encode(data: Uint8Array) {
  let binary = '';
  for (let i = 0; i < data.length; i += 0x8000) {
    binary += String.fromCharCode(...data.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function decode(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function ensureColumns(database: Database, table: string, columns: string[][]) {
  const info = database.exec(`PRAGMA table_info(${table})`);
  const existing = new Set((info[0]?.values ?? []).map((row) => String(row[1])));
  for (const [name, type] of columns) {
    if (!existing.has(name)) database.run(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`);
  }
}

async function loadFromStorage(): Promise<Uint8Array | null> {
  if (isTauri()) {
    try {
      const { readFile } = await import('@tauri-apps/plugin-fs');
      const { appDataDir } = await import('@tauri-apps/api/path');
      return new Uint8Array(await readFile(`${await appDataDir()}\\${DB_FILE}`));
    } catch (error) {
      console.warn('Base locale introuvable, création/lecture de la sauvegarde navigateur.', error);
    }
  }

  try {
    const stored = localStorage.getItem(DB_KEY);
    return stored ? decode(stored) : null;
  } catch (error) {
    console.error('Impossible de lire la base locale.', error);
    return null;
  }
}

async function saveToStorage(data: Uint8Array) {
  const encoded = encode(data);

  // Une copie navigateur protège les données si l'accès au dossier Tauri échoue.
  try {
    localStorage.setItem(DB_KEY, encoded);
  } catch (error) {
    console.error('Impossible de sauvegarder la copie navigateur.', error);
  }

  if (!isTauri()) return;

  try {
    const { writeFile, mkdir } = await import('@tauri-apps/plugin-fs');
    const { appDataDir } = await import('@tauri-apps/api/path');
    const directory = await appDataDir();
    await mkdir(directory, { recursive: true });
    await writeFile(`${directory}\\${DB_FILE}`, data);
  } catch (error) {
    console.error('Impossible de sauvegarder la base sur le disque.', error);
  }
}

export async function getDb(): Promise<Database> {
  if (db) return db;
  if (sqlPromise) return sqlPromise;

  sqlPromise = (async () => {
    const SQL: SqlJsStatic = await initSqlJs({
      locateFile: () => new URL('sql.js/dist/sql-wasm.wasm', import.meta.url).href,
    });
    const existing = await loadFromStorage();
    db = existing ? new SQL.Database(existing) : new SQL.Database();
    db.run('PRAGMA foreign_keys = ON;');
    db.run(SCHEMA_SQL);
    ensureColumns(db, 'entrees', [['beneficiaire', 'TEXT'], ['numero_beneficiaire', 'TEXT']]);
    ensureColumns(db, 'sorties', [['numero_operateur', 'TEXT'], ['beneficiaire', 'TEXT'], ['numero_beneficiaire', 'TEXT']]);
    await persist();
    return db;
  })();

  return sqlPromise;
}

export function persist() {
  persistQueue = persistQueue.then(async () => {
    if (db) await saveToStorage(db.export());
  });
  return persistQueue;
}

function bindParams(stmt: import('sql.js').Statement, params: unknown[]) {
  stmt.bind(params.map((param) => param == null ? null : typeof param === 'number' ? param : String(param)) as never[]);
}

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const database = await getDb();
  const stmt = database.prepare(sql);
  bindParams(stmt, params);
  const rows: T[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as T);
  stmt.free();
  return rows;
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []) {
  const database = await getDb();
  const stmt = database.prepare(sql);
  bindParams(stmt, params);
  stmt.step();
  stmt.free();
  const result = database.exec('SELECT last_insert_rowid() AS id');
  await persist();
  return (result[0]?.values[0]?.[0] as number) ?? 0;
}

export async function executeMany(sql: string, paramsList: unknown[][] = []) {
  const database = await getDb();
  for (const params of paramsList) {
    const stmt = database.prepare(sql);
    bindParams(stmt, params);
    stmt.step();
    stmt.free();
  }
  await persist();
}
