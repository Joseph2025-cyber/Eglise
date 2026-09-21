import { useState } from 'react';
import { ArrowLeft, CheckCircle2, FileText, Save, X } from 'lucide-react';
import type { Categorie, Config, Devise } from '@/types';
import { CULTE_OPTIONS } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { todayISO } from '@/utils/format';
import { generateRecuEntree } from '@/services/pdf';

interface EntryFormProps { config: Config; categories: Categorie[]; onBack: () => void; }

const fieldClass = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const labelClass = 'mb-1.5 block text-sm font-semibold text-gray-700';

export function EntryForm({ config, categories, onBack }: EntryFormProps) {
  const { addEntree } = useFinance();
  const [date, setDate] = useState(todayISO());
  const [culte, setCulte] = useState(CULTE_OPTIONS[0]);
  const [categorieId, setCategorieId] = useState(categories[0]?.id || 0);
  const [devise, setDevise] = useState<Devise>('CDF');
  const [montant, setMontant] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    const value = Number(montant);
    if (!value || value <= 0 || !culte || !categorieId) {
      setError('Veuillez remplir les champs obligatoires et entrer un montant valide');
      return;
    }
    const amounts = devise === 'CDF' ? { montant_cdf: value, montant_usd: 0 } : { montant_cdf: 0, montant_usd: value };
    const result = await addEntree({ date, culte, categorie_id: categorieId, devise, montant: value, ...amounts, note: note.trim() || null });
    if (!result) { setError("Erreur lors de l'enregistrement"); return; }
    generateRecuEntree(config, result, categories.find((category) => category.id === categorieId)?.nom || '');
    setSuccess(true);
    setTimeout(onBack, 1800);
  };

  if (success) return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /><h3 className="mt-4 text-lg font-bold text-gray-800">Entrée enregistrée</h3><p className="mt-1 text-sm text-gray-500">Le reçu a été téléchargé.</p></div></div>;

  return <div className="mx-auto max-w-3xl">
    <div className="mb-5 flex items-center gap-3"><button type="button" onClick={onBack} className="rounded-xl bg-gray-100 p-2.5 transition hover:bg-gray-200"><ArrowLeft className="h-5 w-5 text-gray-600" /></button><div><h1 className="text-xl font-bold text-gray-800">Nouvelle entrée</h1><p className="text-sm text-gray-500">Enregistrer une recette dans la caisse</p></div></div>
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div><label className={labelClass} htmlFor="entry-date">Date</label><input id="entry-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} /></div>
        <div><label className={labelClass} htmlFor="entry-service">Culte / Service</label><select id="entry-service" value={culte} onChange={(event) => setCulte(event.target.value)} className={fieldClass}>{CULTE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></div>
        <div><label className={labelClass} htmlFor="entry-category">Nature</label><select id="entry-category" value={categorieId} onChange={(event) => setCategorieId(Number(event.target.value))} className={fieldClass}>{categories.map((category) => <option key={category.id} value={category.id}>{category.nom}</option>)}</select></div>
        <div><label className={labelClass}>Devise</label><div className="grid grid-cols-2 gap-2">{(['CDF', 'USD'] as Devise[]).map((currency) => <button key={currency} type="button" onClick={() => setDevise(currency)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${devise === currency ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'}`}>{currency}</button>)}</div></div>
        <div><label className={labelClass} htmlFor="entry-amount">Montant ({devise})</label><input id="entry-amount" type="number" min="0" step="0.01" value={montant} onChange={(event) => setMontant(event.target.value)} placeholder="0,00" className={fieldClass} /></div>
        <div className="sm:col-span-2"><label className={labelClass} htmlFor="entry-note">Note <span className="font-normal text-gray-400">(facultatif)</span></label><div className="relative"><FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" /><textarea id="entry-note" value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Ajouter une remarque..." className={`${fieldClass} resize-none pl-9`} /></div></div>
      </div>
      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row"><button type="button" onClick={onBack} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"><X className="mr-2 inline h-4 w-4" />Annuler</button><button type="submit" className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"><Save className="mr-2 inline h-4 w-4" />Enregistrer l'entrée</button></div>
    </form>
  </div>;
}
