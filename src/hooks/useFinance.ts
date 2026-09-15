import { useState, useCallback } from 'react';
import { query, queryOne, execute } from '@/lib/database';
import type { Entree, EntreeWithCategorie, Sortie, Reversement } from '@/types';

export function useFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEntree = useCallback(
    async (data: Omit<Entree, 'id' | 'created_at'>) => {
      setLoading(true);
      setError(null);
      try {
        const id = await execute(
          'INSERT INTO entrees (date, culte, categorie_id, montant, note) VALUES (?, ?, ?, ?, ?)',
          [data.date, data.culte, data.categorie_id, data.montant, data.note],
        );
        const row = await queryOne<EntreeWithCategorie>(
          `SELECT e.*, c.nom as categorie_nom FROM entrees e
           JOIN categories c ON e.categorie_id = c.id WHERE e.id = ?`,
          [id],
        );
        setLoading(false);
        return row;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
        setLoading(false);
        return null;
      }
    },
    [],
  );

  const addSortie = useCallback(async (data: Omit<Sortie, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const id = await execute(
        'INSERT INTO sorties (date, nature, montant, description, nom_operateur, telephone_operateur) VALUES (?, ?, ?, ?, ?, ?)',
        [data.date, data.nature, data.montant, data.description, data.nom_operateur, data.telephone_operateur],
      );
      const row = await queryOne<Sortie>('SELECT * FROM sorties WHERE id = ?', [id]);
      setLoading(false);
      return row;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setLoading(false);
      return null;
    }
  }, []);

  const addReversement = useCallback(async (data: Omit<Reversement, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const id = await execute(
        'INSERT INTO reversements (type, montant, date_reversement, periode_debut, periode_fin) VALUES (?, ?, ?, ?, ?)',
        [data.type, data.montant, data.date_reversement, data.periode_debut, data.periode_fin],
      );
      const row = await queryOne<Reversement>('SELECT * FROM reversements WHERE id = ?', [id]);
      setLoading(false);
      return row;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setLoading(false);
      return null;
    }
  }, []);

  const getEntrees = useCallback(async (start: string, end: string) => {
    return await query<EntreeWithCategorie>(
      `SELECT e.*, c.nom as categorie_nom FROM entrees e
       JOIN categories c ON e.categorie_id = c.id
       WHERE e.date >= ? AND e.date <= ? ORDER BY e.date DESC`,
      [start, end],
    );
  }, []);

  const getSorties = useCallback(async (start: string, end: string) => {
    return await query<Sortie>(
      'SELECT * FROM sorties WHERE date >= ? AND date <= ? ORDER BY date DESC',
      [start, end],
    );
  }, []);

  const getReversements = useCallback(async (start: string, end: string) => {
    return await query<Reversement>(
      'SELECT * FROM reversements WHERE date_reversement >= ? AND date_reversement <= ? ORDER BY date_reversement DESC',
      [start, end],
    );
  }, []);

  const getAllEntrees = useCallback(async () => {
    return await query<EntreeWithCategorie>(
      `SELECT e.*, c.nom as categorie_nom FROM entrees e
       JOIN categories c ON e.categorie_id = c.id ORDER BY e.date ASC`,
      [],
    );
  }, []);

  const getAllSorties = useCallback(async () => {
    return await query<Sortie>('SELECT * FROM sorties ORDER BY date ASC');
  }, []);

  const getAllReversements = useCallback(async () => {
    return await query<Reversement>('SELECT * FROM reversements ORDER BY date_reversement ASC');
  }, []);

  const getMonthlyTotals = useCallback(async (year: number) => {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const entrees = await query<EntreeWithCategorie>(
      `SELECT e.*, c.nom as categorie_nom FROM entrees e
       JOIN categories c ON e.categorie_id = c.id
       WHERE e.date >= ? AND e.date <= ? ORDER BY e.date ASC`,
      [start, end],
    );
    const sorties = await query<Sortie>(
      'SELECT * FROM sorties WHERE date >= ? AND date <= ? ORDER BY date ASC',
      [start, end],
    );

    const monthlyEntrees = new Array(12).fill(0);
    const monthlySorties = new Array(12).fill(0);

    for (const e of entrees) {
      const m = new Date(e.date).getMonth();
      monthlyEntrees[m] += e.montant;
    }
    for (const s of sorties) {
      const m = new Date(s.date).getMonth();
      monthlySorties[m] += s.montant;
    }

    return { monthlyEntrees, monthlySorties, entrees, sorties };
  }, []);

  const deleteAllEntrees = useCallback(async () => {
    await execute('DELETE FROM entrees WHERE id > 0');
  }, []);

  const deleteAllSorties = useCallback(async () => {
    await execute('DELETE FROM sorties WHERE id > 0');
  }, []);

  const deleteAllReversements = useCallback(async () => {
    await execute('DELETE FROM reversements WHERE id > 0');
  }, []);

  const archiveExercice = useCallback(
    async (annee: number, totalEntrees: number, totalSorties: number, totalReversements: number, donnees: string) => {
      await execute(
        'INSERT INTO exercices (annee, total_entrees, total_sorties, total_reversements, donnees) VALUES (?, ?, ?, ?, ?)',
        [annee, totalEntrees, totalSorties, totalReversements, donnees],
      );
    },
    [],
  );

  return {
    loading,
    error,
    addEntree,
    addSortie,
    addReversement,
    getEntrees,
    getSorties,
    getReversements,
    getAllEntrees,
    getAllSorties,
    getAllReversements,
    getMonthlyTotals,
    deleteAllEntrees,
    deleteAllSorties,
    deleteAllReversements,
    archiveExercice,
  };
}
