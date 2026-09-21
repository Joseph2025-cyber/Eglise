import { useState } from 'react';
import { ArrowLeft, Save, X, Calendar, Tag, DollarSign, FileText, User, CheckCircle2 } from 'lucide-react';
import type { Config, Categorie, Devise } from '@/types';
import { CULTE_OPTIONS } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { todayISO, formatDual } from '@/utils/format';
import { generateRecuEntree } from '@/services/pdf';

interface EntryFormProps {
  config: Config;
  categories: Categorie[];
  onBack: () => void;
}

export function EntryForm({ config, categories, onBack }: EntryFormProps) {
  const { addEntree } = useFinance();
  const [date, setDate] = useState(todayISO());
  const [culte, setCulte] = useState<string>(CULTE_OPTIONS[0]);
  const [categorieId, setCategorieId] = useState<number>(categories[0]?.id || 0);
  const [beneficiaire, setBeneficiaire] = useState('');
  const [numeroBeneficiaire, setNumeroBeneficiaire] = useState('');
  const [devise, setDevise] = useState<Devise>('CDF');
  const [montant, setMontant] = useState('');
  const [note, setNote] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeAmounts = () => {
    const m = parseInt(montant, 10) || 0;
    if (devise === 'CDF') return { montant_cdf: m, montant_usd: 0 };
    return { montant_cdf: 0, montant_usd: m };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montantNum = parseInt(montant, 10);
    if (!montantNum || montantNum <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }
    const { montant_cdf, montant_usd } = computeAmounts();
    const result = await addEntree({
      date,
      culte,
      categorie_id: categorieId,
      beneficiaire: beneficiaire.trim() || null,
      numero_beneficiaire: numeroBeneficiaire.trim() || null,
      devise,
      montant: montantNum,
      montant_cdf,
      montant_usd,
      note: note || null,
    });
    if (result) {
      const catNom = categories.find((c) => c.id === categorieId)?.nom || '';
      generateRecuEntree(config, result, catNom);
      setSuccess(true);
      setTimeout(() => onBack(), 1800);
    } else {
      setError("Erreur lors de l'enregistrement");
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center animate-[fadeIn_0.3s_ease]">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Entrée enregistrée</h3>
          <p className="text-gray-500 mt-1">Le reçu PDF a été téléchargé avec succès</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Enregistrer une Entrée</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 text-emerald-600" /> Date
          </label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 text-emerald-600" /> Culte / Service
          </label>
          <select value={culte} onChange={(e) => setCulte(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
            {CULTE_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 text-emerald-600" /> Nature de la recette
          </label>
          <select value={categorieId} onChange={(e) => setCategorieId(parseInt(e.target.value, 10))} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.nom}</option>))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 text-emerald-600" /> Bénéficiaire
          </label>
          <input type="text" value={beneficiaire} onChange={(e) => setBeneficiaire(e.target.value)} placeholder="Nom du bénéficiaire" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 text-emerald-600" /> N° Bénéficiaire
          </label>
          <input type="text" value={numeroBeneficiaire} onChange={(e) => setNumeroBeneficiaire(e.target.value)} placeholder="Numéro du bénéficiaire" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Devise
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDevise('CDF')} className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all border ${devise === 'CDF' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
              Franc Congolais (CDF)
            </button>
            <button type="button" onClick={() => setDevise('USD')} className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all border ${devise === 'USD' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
              Dollar Américain (USD)
            </button>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Montant ({devise})
          </label>
          <input type="number" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="0" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-semibold" />
          {montant && parseInt(montant, 10) > 0 && (
            <p className="text-sm text-emerald-600 mt-1 font-medium">{formatDual(...Object.values(computeAmounts()) as [number, number])}</p>
          )}
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 text-emerald-600" /> Note (optionnel)
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none" placeholder="Note libre..." />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Enregistrer
          </button>
          <button type="button" onClick={onBack} className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-2">
            <X className="w-5 h-5" /> Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
