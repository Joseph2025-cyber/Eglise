import { useState, useEffect, useCallback } from 'react';
import { query, queryOne, execute } from '@/lib/database';
import type { Config, Categorie } from '@/types';

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConfig = useCallback(async () => {
    const row = await queryOne<Config>('SELECT * FROM config WHERE id = 1');
    if (row) setConfig(row);
  }, []);

  const loadCategories = useCallback(async () => {
    const rows = await query<Categorie>('SELECT * FROM categories ORDER BY ordre ASC');
    if (rows) setCategories(rows);
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadConfig(), loadCategories()]);
      setLoading(false);
    })();
  }, [loadConfig, loadCategories]);

  const updateConfig = useCallback(
    async (updates: Partial<Config>) => {
      const fields = Object.keys(updates);
      const setClause = fields.map((f) => `${f} = ?`).join(', ');
      const values = fields.map((f) => updates[f as keyof Config]);
      await execute(`UPDATE config SET ${setClause} WHERE id = 1`, values);
      const row = await queryOne<Config>('SELECT * FROM config WHERE id = 1');
      if (row) setConfig(row);
      return { data: row, error: null };
    },
    [],
  );

  return { config, categories, loading, loadConfig, updateConfig };
}
