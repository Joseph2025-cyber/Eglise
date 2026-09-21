import { useState, useCallback } from 'react';
import { query, queryOne, execute } from '@/lib/database';
import type { Entree, EntreeWithCategorie, Exercice, Reversement, Sortie } from '@/types';

export function useFinance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async <T,>(action: () => Promise<T>, message: string): Promise<T | null> => {
    setLoading(true); setError(null);
    try { return await action(); } catch { setError(message); return null; } finally { setLoading(false); }
  }, []);

  const addEntree = useCallback((data: Omit<Entree, 'id' | 'created_at'>) => run(async () => {
    const id = await execute('INSERT INTO entrees (date, culte, categorie_id, beneficiaire, numero_beneficiaire, devise, montant, montant_cdf, montant_usd, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.date, data.culte, data.categorie_id, data.beneficiaire, data.numero_beneficiaire, data.devise, data.montant, data.montant_cdf, data.montant_usd, data.note]);
    return queryOne<EntreeWithCategorie>('SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.id = ?', [id]);
  }, 'Erreur lors de l’ajout de l’entrée'), [run]);

  const addSortie = useCallback((data: Omit<Sortie, 'id' | 'created_at'>) => run(async () => {
    const id = await execute('INSERT INTO sorties (date, nature, devise, montant, montant_cdf, montant_usd, description, nom_operateur, numero_operateur, telephone_operateur, beneficiaire, numero_beneficiaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.date, data.nature, data.devise, data.montant, data.montant_cdf, data.montant_usd, data.description, data.nom_operateur, data.numero_operateur, data.telephone_operateur, data.beneficiaire, data.numero_beneficiaire]);
    return queryOne<Sortie>('SELECT * FROM sorties WHERE id = ?', [id]);
  }, 'Erreur lors de l’ajout de la sortie'), [run]);

  const addReversement = useCallback((data: Omit<Reversement, 'id' | 'created_at'>) => run(async () => { const id = await execute('INSERT INTO reversements (type, montant_cdf, montant_usd, date_reversement, periode_debut, periode_fin) VALUES (?, ?, ?, ?, ?, ?)', [data.type, data.montant_cdf, data.montant_usd, data.date_reversement, data.periode_debut, data.periode_fin]); return queryOne<Reversement>('SELECT * FROM reversements WHERE id = ?', [id]); }, 'Erreur lors de l’ajout du reversement'), [run]);

  const updateEntree = useCallback((id: number, data: Omit<Entree, 'id' | 'created_at'>) => run(async () => { await execute('DELETE FROM entrees WHERE id = ?', [id]); const newId = await execute('INSERT INTO entrees (date, culte, categorie_id, beneficiaire, numero_beneficiaire, devise, montant, montant_cdf, montant_usd, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.date, data.culte, data.categorie_id, data.beneficiaire, data.numero_beneficiaire, data.devise, data.montant, data.montant_cdf, data.montant_usd, data.note]); return queryOne<EntreeWithCategorie>('SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.id = ?', [newId]); }, 'Erreur lors de la modification de l’entrée'), [run]);
  const updateSortie = useCallback((id: number, data: Omit<Sortie, 'id' | 'created_at'>) => run(async () => { await execute('DELETE FROM sorties WHERE id = ?', [id]); const newId = await execute('INSERT INTO sorties (date, nature, devise, montant, montant_cdf, montant_usd, description, nom_operateur, numero_operateur, telephone_operateur, beneficiaire, numero_beneficiaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [data.date, data.nature, data.devise, data.montant, data.montant_cdf, data.montant_usd, data.description, data.nom_operateur, data.numero_operateur, data.telephone_operateur, data.beneficiaire, data.numero_beneficiaire]); return queryOne<Sortie>('SELECT * FROM sorties WHERE id = ?', [newId]); }, 'Erreur lors de la modification de la sortie'), [run]);

  const getEntrees = useCallback((start: string, end: string) => query<EntreeWithCategorie>('SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id WHERE e.date >= ? AND e.date <= ? ORDER BY e.date DESC, e.id DESC', [start, end]), []);
  const getSorties = useCallback((start: string, end: string) => query<Sortie>('SELECT * FROM sorties WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC', [start, end]), []);
  const getReversements = useCallback((start: string, end: string) => query<Reversement>('SELECT * FROM reversements WHERE date_reversement >= ? AND date_reversement <= ? ORDER BY date_reversement DESC', [start, end]), []);
  const getAllEntrees = useCallback(() => query<EntreeWithCategorie>('SELECT e.*, c.nom AS categorie_nom FROM entrees e JOIN categories c ON e.categorie_id = c.id ORDER BY e.date DESC, e.id DESC'), []);
  const getAllSorties = useCallback(() => query<Sortie>('SELECT * FROM sorties ORDER BY date DESC, id DESC'), []);
  const getAllReversements = useCallback(() => query<Reversement>('SELECT * FROM reversements ORDER BY date_reversement DESC, id DESC'), []);
  const getExercice = useCallback((year: number) => queryOne<Exercice>('SELECT * FROM exercices WHERE annee = ?', [year]), []);
  const getBalance = useCallback(async (devise: 'CDF' | 'USD') => { const key = devise === 'CDF' ? 'montant_cdf' : 'montant_usd'; const row = await queryOne<{ solde: number }>(`SELECT COALESCE((SELECT SUM(${key}) FROM entrees), 0) - COALESCE((SELECT SUM(${key}) FROM sorties), 0) - COALESCE((SELECT SUM(${key}) FROM reversements), 0) AS solde`); return Number(row?.solde || 0); }, []);
  const getMonthlyTotals = useCallback(async (year: number) => { const start = `${year}-01-01`; const end = `${year}-12-31`; const [entrees, sorties, reversements] = await Promise.all([getEntrees(start, end), getSorties(start, end), getReversements(start, end)]); const result = (key: 'montant_cdf' | 'montant_usd', dateKey: 'date' | 'date_reversement', rows: Array<EntreeWithCategorie | Sortie | Reversement>) => Array.from({ length: 12 }, (_, month) => rows.filter((row) => new Date(`${row[dateKey]}T00:00:00`).getMonth() === month).reduce((sum, row) => sum + Number(row[key]), 0)); return { monthlyEntreesCdf: result('montant_cdf', 'date', entrees), monthlyEntreesUsd: result('montant_usd', 'date', entrees), monthlySortiesCdf: result('montant_cdf', 'date', sorties), monthlySortiesUsd: result('montant_usd', 'date', sorties), monthlyReversementsCdf: result('montant_cdf', 'date_reversement', reversements), monthlyReversementsUsd: result('montant_usd', 'date_reversement', reversements), entrees, sorties, reversements }; }, [getEntrees, getSorties, getReversements]);
  const deleteAllEntrees = useCallback(() => execute('DELETE FROM entrees WHERE id > 0'), []); const deleteAllSorties = useCallback(() => execute('DELETE FROM sorties WHERE id > 0'), []); const deleteAllReversements = useCallback(() => execute('DELETE FROM reversements WHERE id > 0'), []); const deleteAllExercices = useCallback(() => execute('DELETE FROM exercices WHERE id > 0'), []); const archiveExercice = useCallback((annee: number, totalEntrees: number, totalSorties: number, totalReversements: number, donnees: string) => execute('INSERT INTO exercices (annee, total_entrees, total_sorties, total_reversements, donnees) VALUES (?, ?, ?, ?, ?)', [annee, totalEntrees, totalSorties, totalReversements, donnees]), []);
  return { loading, error, addEntree, addSortie, addReversement, updateEntree, updateSortie, getEntrees, getSorties, getReversements, getAllEntrees, getAllSorties, getAllReversements, getExercice, getBalance, getMonthlyTotals, deleteAllEntrees, deleteAllSorties, deleteAllReversements, deleteAllExercices, archiveExercice };
}
