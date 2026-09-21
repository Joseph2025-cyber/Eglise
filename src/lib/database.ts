import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Calendar, ChevronRight, CheckCircle2, PencilLine, Trash2, Clock3, Search, User } from 'lucide-react';
import type { Config, EntreeWithCategorie, Sortie } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { formatDateShort, todayISO } from '@/utils/format';
import { generateRecuEntree, generateRecuSortie } from '@/services/pdf';

interface HistoryPageProps { config: Config; onBack: () => void; }

type FilterType = 'day' | 'week' | 'month' | 'all';

function isModifiable(createdAt: string | null | undefined): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  return now - created <= 24 * 60 * 60 * 1000;
}

function dateFilterRange(filter: FilterType) {
  const now = new Date();
  const start = new Date(now);
  if (filter === 'day') {
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString().split('T')[0], end: todayISO() };
  }
  if (filter === 'week') {
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString().split('T')[0], end: todayISO() };
  }
  if (filter === 'month') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return { start: start.toISOString().split('T')[0], end: todayISO() };
  }
  return { start: '2000-01-01', end: todayISO() };
}

export function HistoryPage({ config, onBack }: HistoryPageProps) {
  const { getAllEntrees, getAllSorties, updateEntree, updateSortie } = useFinance();
  const [activeTab, setActiveTab] = useState<'entrees' | 'sorties'>('entrees');
  const [filter, setFilter] = useState<FilterType>('all');
  const [entrees, setEntrees] = useState<EntreeWithCategorie[]>([]);
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ type: 'entree' | 'sortie'; id: number } | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    const [allEntrees, allSorties] = await Promise.all([getAllEntrees(), getAllSorties()]);
    const range = dateFilterRange(filter);
    const filteredEntrees = allEntrees.filter((e) => e.date >= range.start && e.date <= range.end);
    const filteredSorties = allSorties.filter((s) => s.date >= range.start && s.date <= range.end);
    setEntrees(filteredEntrees);
    setSorties(filteredSorties);
    setLoading(false);
  };

  useEffect(() => { void loadData(); }, [filter]);

  const openEdit = (type: 'entree' | 'sortie', item: EntreeWithCategorie | Sortie) => {
    if (type === 'entree') {
      setEditing({ type, id: item.id });
      setEditForm({
        date: item.date,
        culte: item.culte,
        categorie_id: item.categorie_id,
        beneficiaire: item.beneficiaire || '',
        numero_beneficiaire: item.numero_beneficiaire || '',
        devise: item.devise,
        montant: item.montant,
        note: item.note || '',
      });
      return;
    }
    setEditing({ type, id: item.id });
    setEditForm({
      date: item.date,
      nature: item.nature,
      devise: item.devise,
      montant: item.montant,
      description: item.description || '',
      nom_operateur: item.nom_operateur,
      telephone_operateur: item.telephone_operateur,
    });
  };

  const saveEdit = async () => {
    if (!editing || !editForm) return;
    if (editing.type === 'entree') {
      const updated = await updateEntree(editing.id, {
        date: editForm.date,
        culte: editForm.culte,
        categorie_id: Number(editForm.categorie_id),
        beneficiaire: editForm.beneficiaire?.trim() || null,
        numero_beneficiaire: editForm.numero_beneficiaire?.trim() || null,
        devise: editForm.devise,
        montant: Number(editForm.montant),
        montant_cdf: editForm.devise === 'CDF' ? Number(editForm.montant) : 0,
        montant_usd: editForm.devise === 'USD' ? Number(editForm.montant) : 0,
        note: editForm.note || null,
      });
      if (updated) {
        generateRecuEntree(config, updated, updated.categorie_nom || 'Entrée');
      }
    } else {
      const updated = await updateSortie(editing.id, {
        date: editForm.date,
        nature: editForm.nature,
        devise: editForm.devise,
        montant: Number(editForm.montant),
        montant_cdf: editForm.devise === 'CDF' ? Number(editForm.montant) : 0,
        montant_usd: editForm.devise === 'USD' ? Number(editForm.montant) : 0,
        description: editForm.description || null,
        nom_operateur: editForm.nom_operateur,
        telephone_operateur: editForm.telephone_operateur,
      });
      if (updated) {
        generateRecuSortie(config, updated);
      }
    }
    setEditing(null);
    setEditForm(null);
    await loadData();
  };

  const displayed = activeTab === 'entrees' ? entrees : sorties;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Historique</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setActiveTab('entrees')} className={`px-4 py-2 rounded-xl font-semibold ${activeTab === 'entrees' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            Entrées
          </button>
          <button onClick={() => setActiveTab('sorties')} className={`px-4 py-2 rounded-xl font-semibold ${activeTab === 'sorties' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
            Sorties
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'day', label: 'Du jour' },
            { key: 'week', label: 'De la semaine' },
            { key: 'month', label: 'Du mois' },
            { key: 'all', label: 'Tous' },
          ].map((item) => (
            <button key={item.key} onClick={() => setFilter(item.key as FilterType)} className={`px-3 py-2 rounded-lg text-sm font-medium ${filter === item.key ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">{activeTab === 'entrees' ? 'Catégorie' : 'Nature'}</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">{activeTab === 'entrees' ? 'Bénéficiaire' : 'Opérateur'}</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">{activeTab === 'entrees' ? 'N° Bénéficiaire' : 'Téléphone'}</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Devise</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Montant</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucune donnée pour cette période.</td>
                  </tr>
                )}
                {activeTab === 'entrees' ? entrees.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{formatDateShort(item.date)}</td>
                    <td className="px-4 py-3">{item.categorie_nom || '—'}</td>
                    <td className="px-4 py-3">{item.beneficiaire || '—'}</td>
                    <td className="px-4 py-3">{item.numero_beneficiaire || '—'}</td>
                    <td className="px-4 py-3">{item.devise}</td>
                    <td className="px-4 py-3 font-semibold">{item.montant}</td>
                    <td className="px-4 py-3">
                      {isModifiable(item.created_at) ? (
                        <button onClick={() => openEdit('entree', item)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                          <PencilLine className="w-4 h-4" /> Modifier
                        </button>
                      ) : (
                        <span className="text-gray-400 inline-flex items-center gap-1"><Clock3 className="w-4 h-4" />Lecture seule</span>
                      )}
                    </td>
                  </tr>
                )) : sorties.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{formatDateShort(item.date)}</td>
                    <td className="px-4 py-3">{item.nature}</td>
                    <td className="px-4 py-3">{item.nom_operateur}</td>
                    <td className="px-4 py-3">{item.telephone_operateur}</td>
                    <td className="px-4 py-3">{item.devise}</td>
                    <td className="px-4 py-3 font-semibold">{item.montant}</td>
                    <td className="px-4 py-3">
                      {isModifiable(item.created_at) ? (
                        <button onClick={() => openEdit('sortie', item)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100">
                          <PencilLine className="w-4 h-4" /> Modifier
                        </button>
                      ) : (
                        <span className="text-gray-400 inline-flex items-center gap-1"><Clock3 className="w-4 h-4" />Lecture seule</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && editForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Modifier la transaction</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
              </div>
              {editing.type === 'entree' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Culte</label>
                    <input type="text" value={editForm.culte} onChange={(e) => setEditForm({ ...editForm, culte: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <input type="number" value={editForm.categorie_id} onChange={(e) => setEditForm({ ...editForm, categorie_id: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire</label>
                    <input type="text" value={editForm.beneficiaire} onChange={(e) => setEditForm({ ...editForm, beneficiaire: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">N° Bénéficiaire</label>
                    <input type="text" value={editForm.numero_beneficiaire} onChange={(e) => setEditForm({ ...editForm, numero_beneficiaire: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nature</label>
                    <input type="text" value={editForm.nature} onChange={(e) => setEditForm({ ...editForm, nature: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opérateur</label>
                    <input type="text" value={editForm.nom_operateur} onChange={(e) => setEditForm({ ...editForm, nom_operateur: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                <select value={editForm.devise} onChange={(e) => setEditForm({ ...editForm, devise: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2">
                  <option value="CDF">CDF</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                <input type="number" step="0.01" value={editForm.montant} onChange={(e) => setEditForm({ ...editForm, montant: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">Enregistrer</button>
              <button onClick={() => { setEditing(null); setEditForm(null); }} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
