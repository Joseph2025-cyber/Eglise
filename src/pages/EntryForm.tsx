import { useState } from 'react';
import { ArrowLeft, Save, X, Calendar, Tag, DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import type { Categorie, Config, Devise } from '@/types';
import { CULTE_OPTIONS } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { todayISO, formatDual } from '@/utils/format';
import { generateRecuEntree } from '@/services/pdf';

interface EntryFormProps { config: Config; categories: Categorie[]; onBack: () => void; }

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

  const amounts = () => {
    const value = Number(montant) || 0;
    return devise === 'CDF' ? { montant_cdf: value, montant_usd: 0 } : { montant_cdf: 0, montant_usd: value };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(montant);
    if (!value || value <= 0 || !culte || !categorieId) {
      setError('Veuillez remplir les champs obligatoires et entrer un montant valide');
      return;
    }
    const result = await addEntree({ date, culte, categorie_id: categorieId, devise, montant: value, ...amounts(), note: note.trim() || null });
    if (!result) { setError("Erreur lors de l'enregistrement"); return; }
    generateRecuEntree(config, result, categories.find((category) => category.id === categorieId)?.nom || '');
    setSuccess(true);
    setTimeout(onBack, 1800);
  };

  if (success) return <div className="min-h-[60vh] flex items-center justify-center"><div className="text-center"><CheckCircle2 className="w-16 h-16 mx-auto text-emerald-600" /><h3 className="text-xl font-bold text-gray-800 mt-4">Entrée enregistrée</h3><p className="text-gray-500 mt-1">Le reçu PDF a été téléchargé</p></div></div>;

  return <div className="max-w-2xl mx-auto">
    <div className="flex items-center gap-3 mb-6"><button onClick={onBack} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ArrowLeft className="w-5 h-5 text-gray-600" /></button><h1 className="text-2xl font-bold text-gray-800">Enregistrer une Entrée</h1></div>
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div><label className="field-label"><Calendar className="field-icon" /> Date</label><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field-input" /></div>
      <div><label className="field-label"><Tag className="field-icon" /> Culte / Service</label><select value={culte} onChange={(event) => setCulte(event.target.value)} className="field-input bg-white">{CULTE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
      <div><label className="field-label"><Tag className="field-icon" /> Nature</label><select value={categorieId} onChange={(event) => setCategorieId(Number(event.target.value))} className="field-input bg-white">{categories.map((category) => <option key={category.id} value={category.id}>{category.nom}</option>)}</select></div>
      <div><label className="field-label"><DollarSign className="field-icon" /> Devise</label><div className="flex gap-3">{(['CDF', 'USD'] as Devise[]).map((currency) => <button key={currency} type="button" onClick={() => setDevise(currency)} className={`flex-1 py-2.5 rounded-xl border font-semibold ${devise === currency ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{currency}</button>)}</div></div>
      <div><label className="block text-sm font-medium text-gray-700 mb-2">Montant ({devise})</label><input type="number" min="0" step="0.01" value={montant} onChange={(event) => setMontant(event.target.value)} className="field-input text-lg font-semibold" />{montant && Number(montant) > 0 && <p className="text-sm text-emerald-600 mt-1 font-medium">{formatDual(amounts().montant_cdf, amounts().montant_usd)}</p>}</div>
      <div><label className="field-label"><FileText className="field-icon" /> Note</label><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="field-input" /></div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}
      <div className="flex gap-3"><button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Enregistrer</button><button type="button" onClick={onBack} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2"><X className="w-5 h-5" /> Annuler</button></div>
    </form>
  </div>;
}
