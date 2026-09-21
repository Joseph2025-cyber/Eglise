import { useState, useEffect } from 'react';
import { ArrowLeft, PencilLine, Clock3 } from 'lucide-react';
import type { Config, EntreeWithCategorie, Sortie } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { formatDateShort, todayISO } from '@/utils/format';
import { generateRecuEntree, generateRecuSortie } from '@/services/pdf';

interface HistoryPageProps { config: Config; onBack: () => void; }
type FilterType = 'day' | 'week' | 'month' | 'all';

function isModifiable(createdAt: string | null | undefined): boolean {
  return Boolean(createdAt && Date.now() - new Date(createdAt).getTime() <= 24 * 60 * 60 * 1000);
}

function dateFilterRange(filter: FilterType) {
  const today = new Date();
  const end = todayISO();
  const start = new Date(today);
  if (filter === 'day') start.setHours(0, 0, 0, 0);
  if (filter === 'week') start.setDate(today.getDate() - 6);
  if (filter === 'month') start.setDate(1);
  return { start: filter === 'all' ? '2000-01-01' : start.toISOString().slice(0, 10), end };
}

export function HistoryPage({ config, onBack }: HistoryPageProps) {
  const { getAllEntrees, getAllSorties, updateEntree, updateSortie } = useFinance();
  const [activeTab, setActiveTab] = useState<'entrees' | 'sorties'>('entrees');
  const [filter, setFilter] = useState<FilterType>('all');
  const [entrees, setEntrees] = useState<EntreeWithCategorie[]>([]);
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [editing, setEditing] = useState<{ type: 'entree' | 'sortie'; item: EntreeWithCategorie | Sortie } | null>(null);

  const loadData = async () => {
    const [allEntrees, allSorties] = await Promise.all([getAllEntrees(), getAllSorties()]);
    const range = dateFilterRange(filter);
    setEntrees(allEntrees.filter((item) => item.date >= range.start && item.date <= range.end));
    setSorties(allSorties.filter((item) => item.date >= range.start && item.date <= range.end));
  };
  useEffect(() => { void loadData(); }, [filter]);

  const edit = async (type: 'entree' | 'sortie', item: EntreeWithCategorie | Sortie) => {
    if (!isModifiable(item.created_at)) return;
    if (type === 'entree') {
      const entry = item as EntreeWithCategorie;
      const result = await updateEntree(entry.id, { date: entry.date, culte: entry.culte, categorie_id: entry.categorie_id, beneficiaire: entry.beneficiaire, numero_beneficiaire: entry.numero_beneficiaire, devise: entry.devise, montant: entry.montant, montant_cdf: entry.montant_cdf, montant_usd: entry.montant_usd, note: entry.note });
      if (result) generateRecuEntree(config, result, result.categorie_nom || '');
    } else {
      const sortie = item as Sortie;
      const result = await updateSortie(sortie.id, { date: sortie.date, nature: sortie.nature, devise: sortie.devise, montant: sortie.montant, montant_cdf: sortie.montant_cdf, montant_usd: sortie.montant_usd, description: sortie.description, nom_operateur: sortie.nom_operateur, telephone_operateur: sortie.telephone_operateur });
      if (result) generateRecuSortie(config, result);
    }
    setEditing(null);
    await loadData();
  };

  const rows = activeTab === 'entrees' ? entrees : sorties;
  return <div className="max-w-5xl mx-auto"><div className="flex items-center gap-3 mb-6"><button onClick={onBack} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ArrowLeft className="w-5 h-5 text-gray-600" /></button><h1 className="text-2xl font-bold text-gray-800">Historique</h1></div><div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 flex flex-wrap gap-2"><button onClick={() => setActiveTab('entrees')} className={`px-4 py-2 rounded-xl font-semibold ${activeTab === 'entrees' ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>Entrées</button><button onClick={() => setActiveTab('sorties')} className={`px-4 py-2 rounded-xl font-semibold ${activeTab === 'sorties' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>Sorties</button>{(['day', 'week', 'month', 'all'] as FilterType[]).map((value) => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-2 rounded-lg text-sm ${filter === value ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>{value === 'day' ? 'Du jour' : value === 'week' ? 'Semaine' : value === 'month' ? 'Mois' : 'Tous'}</button>)}</div><div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">{activeTab === 'entrees' ? 'Catégorie' : 'Nature'}</th><th className="px-4 py-3">Devise</th><th className="px-4 py-3">Montant</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Aucune donnée pour cette période.</td></tr> : rows.map((item) => { const entry = activeTab === 'entrees'; const label = entry ? (item as EntreeWithCategorie).categorie_nom || '—' : (item as Sortie).nature; return <tr key={item.id} className="border-t border-gray-100"><td className="px-4 py-3">{formatDateShort(item.date)}</td><td className="px-4 py-3">{label}</td><td className="px-4 py-3">{item.devise}</td><td className="px-4 py-3 font-semibold">{item.montant}</td><td className="px-4 py-3">{isModifiable(item.created_at) ? <button onClick={() => setEditing({ type: entry ? 'entree' : 'sortie', item })} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100"><PencilLine className="w-4 h-4" /> Modifier</button> : <span className="text-gray-400 inline-flex items-center gap-1"><Clock3 className="w-4 h-4" /> Lecture seule</span>}</td></tr>; })}</tbody></table></div></div>{editing && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl p-6 max-w-md w-full"><h2 className="font-bold mb-4">Confirmer la modification</h2><p className="text-sm text-gray-600 mb-5">Les données existantes seront réenregistrées et un nouveau reçu sera généré.</p><div className="flex gap-3"><button onClick={() => void edit(editing.type, editing.item)} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white">Confirmer</button><button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-xl bg-gray-100">Annuler</button></div></div></div>}</div>;
}
