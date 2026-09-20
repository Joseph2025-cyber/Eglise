import { useState, useCallback } from 'react';
import { query, queryOne, execute } from '@/lib/database';
import type { Entree, EntreeWithCategorie, Sortie, Reversement, Exercice } from '@/types';

export function useFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addEntree = useCallback(async (data: Omit<Entree, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const id = await execute(
        `INSERT INTO entrees (date, culte, categorie_id, devise, montant, montant_cdf, montant_usd, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.date, data.culte, data.categorie_id, data.devise, data.montant, data.montant_cdf, data.montant_usd, data.note],
      );
      return await queryOne<EntreeWithCategorie>(`SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.id = ?`, [id]);
    } catch {
      setError('Erreur lors de l’ajout de l’entrée');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addSortie = useCallback(async (data: Omit<Sortie, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const id = await execute(
        `INSERT INTO sorties (date, nature, devise, montant, montant_cdf, montant_usd, description, nom_operateur, telephone_operateur)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.date, data.nature, data.devise, data.montant, data.montant_cdf, data.montant_usd, data.description, data.nom_operateur, data.telephone_operateur],
      );
      return await queryOne<Sortie>('SELECT * FROM sorties WHERE id = ?', [id]);
    } catch {
      setError('Erreur lors de l’ajout de la sortie');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addReversement = useCallback(async (data: Omit<Reversement, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      const id = await execute(
        `INSERT INTO reversements (type, montant_cdf, montant_usd, date_reversement, periode_debut, periode_fin)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.type, data.montant_cdf, data.montant_usd, data.date_reversement, data.periode_debut, data.periode_fin],
      );
      return await queryOne<Reversement>('SELECT * FROM reversements WHERE id = ?', [id]);
    } catch {
      setError('Erreur lors de l’ajout du reversement');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEntree = useCallback(async (id: number, data: Omit<Entree, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      await execute('DELETE FROM entrees WHERE id = ?', [id]);
      const newId = await execute(
        `INSERT INTO entrees (date, culte, categorie_id, devise, montant, montant_cdf, montant_usd, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.date, data.culte, data.categorie_id, data.devise, data.montant, data.montant_cdf, data.montant_usd, data.note],
      );
      return await queryOne<EntreeWithCategorie>(`SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.id = ?`, [newId]);
    } catch {
      setError('Erreur lors de la modification de l’entrée');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSortie = useCallback(async (id: number, data: Omit<Sortie, 'id' | 'created_at'>) => {
    setLoading(true);
    setError(null);
    try {
      await execute('DELETE FROM sorties WHERE id = ?', [id]);
      const newId = await execute(
        `INSERT INTO sorties (date, nature, devise, montant, montant_cdf, montant_usd, description, nom_operateur, telephone_operateur)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.date, data.nature, data.devise, data.montant, data.montant_cdf, data.montant_usd, data.description, data.nom_operateur, data.telephone_operateur],
      );
      return await queryOne<Sortie>('SELECT * FROM sorties WHERE id = ?', [newId]);
    } catch {
      setError('Erreur lors de la modification de la sortie');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getEntrees = useCallback((start: string, end: string) =>
    query<EntreeWithCategorie>(
      'SELECT e.*, c.nom categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.date >= ? AND e.date <= ? ORDER BY e.date DESC',
      [start, end],
    ), []);

  const getSorties = useCallback((start: string, end: string) =>
    query<Sortie>('SELECT * FROM sorties WHERE date >= ? AND date <= ? ORDER BY date DESC', [start, end]), []);

  const getReversements = useCallback((start: string, end: string) =>
    query<Reversement>('SELECT * FROM reversements WHERE date_reversement >= ? AND date_reversement <= ? ORDER BY date_reversement DESC', [start, end]), []);

  const getAllEntrees = useCallback(() =>
    query<EntreeWithCategorie>('SELECT e.*, c.nom categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id ORDER BY e.date DESC, e.id DESC'), []);

  const getAllSorties = useCallback(() =>
    query<Sortie>('SELECT * FROM sorties ORDER BY date DESC, id DESC'), []);

  const getAllReversements = useCallback(() =>
    query<Reversement>('SELECT * FROM reversements ORDER BY date_reversement DESC, id DESC'), []);

  const getExercice = useCallback((year: number) =>
    queryOne<Exercice>('SELECT * FROM exercices WHERE annee = ?', [year]), []);

  const getMonthlyTotals = useCallback(async (year: number) => {
    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const [entrees, sorties, reversements] = await Promise.all([
      query<EntreeWithCategorie>(
        `SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.date >= ? AND e.date <= ? ORDER BY e.date ASC`,
        [start, end],
      ),
      query<Sortie>('SELECT * FROM sorties WHERE date >= ? AND date <= ? ORDER BY date ASC', [start, end]),
      query<Reversement>('SELECT * FROM reversements WHERE date_reversement >= ? AND date_reversement <= ? ORDER BY date_reversement ASC', [start, end]),
    ]);

    const monthlyEntreesCdf = Array.from({ length: 12 }, () => 0);
    const monthlyEntreesUsd = Array.from({ length: 12 }, () => 0);
    const monthlySortiesCdf = Array.from({ length: 12 }, () => 0);
    const monthlySortiesUsd = Array.from({ length: 12 }, () => 0);
    const monthlyReversementsCdf = Array.from({ length: 12 }, () => 0);
    const monthlyReversementsUsd = Array.from({ length: 12 }, () => 0);

    for (const e of entrees) {
      const month = new Date(`${e.date}T00:00:00`).getMonth();
      monthlyEntreesCdf[month] += e.montant_cdf;
      monthlyEntreesUsd[month] += e.montant_usd;
    }

    for (const s of sorties) {
      const month = new Date(`${s.date}T00:00:00`).getMonth();
      monthlySortiesCdf[month] += s.montant_cdf;
      monthlySortiesUsd[month] += s.montant_usd;
    }

    for (const r of reversements) {
      const month = new Date(`${r.date_reversement}T00:00:00`).getMonth();
      monthlyReversementsCdf[month] += r.montant_cdf;
      monthlyReversementsUsd[month] += r.montant_usd;
    }

    return { monthlyEntreesCdf, monthlyEntreesUsd, monthlySortiesCdf, monthlySortiesUsd, monthlyReversementsCdf, monthlyReversementsUsd, entrees, reversements, sorties };
  }, []);

  const deleteAllEntrees = useCallback(() => execute('DELETE FROM entrees WHERE id > 0'), []);
  const deleteAllSorties = useCallback(() => execute('DELETE FROM sorties WHERE id > 0'), []);
  const deleteAllReversements = useCallback(() => execute('DELETE FROM reversements WHERE id > 0'), []);
  const deleteAllExercices = useCallback(() => execute('DELETE FROM exercices WHERE id > 0'), []);

  const archiveExercice = useCallback(
    (annee: number, totalEntrees: number, totalSorties: number, totalReversements: number, donnees: string) =>
      execute(
        'INSERT INTO exercices (annee, total_entrees, total_sorties, total_reversements, donnees) VALUES (?, ?, ?, ?, ?)',
        [annee, totalEntrees, totalSorties, totalReversements, donnees],
      ),
    [],
  );

  return {
    loading,
    error,
    addEntree,
    addSortie,
    addReversement,
    updateEntree,
    updateSortie,
    getEntrees,
    getSorties,
    getReversements,
    getAllEntrees,
    getAllSorties,
    getAllReversements,
    getExercice,
    getMonthlyTotals,
    deleteAllEntrees,
    deleteAllSorties,
    deleteAllReversements,
    deleteAllExercices,
    archiveExercice,
  };
}

