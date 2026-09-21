import { useState } from 'react';
import { ArrowLeft, Save, X, Calendar, Tag, DollarSign, FileText, Lock, User, Phone, Hash, CheckCircle2 } from 'lucide-react';
import type { Config, Devise } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { todayISO, formatDual } from '@/utils/format';
import { generateRecuSortie } from '@/services/pdf';

interface ExitFormProps { config: Config; onBack: () => void; }

export function ExitForm({ config, onBack }: ExitFormProps) {
  const { addSortie } = useFinance();
  const [date, setDate] = useState(todayISO());
  const [nature, setNature] = useState('');
  const [devise, setDevise] = useState<Devise>('CDF');
  const [montant, setMontant] = useState('');
  const [description, setDescription] = useState('');
  const [nomOperateur, setNomOperateur] = useState('');
  const [numeroOperateur, setNumeroOperateur] = useState('');
  const [telephoneOperateur, setTelephoneOperateur] = useState('');
  const [beneficiaire, setBeneficiaire] = useState('');
  const [numeroBeneficiaire, setNumeroBeneficiaire] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amounts = () => { const value = Number(montant) || 0; return devise === 'CDF' ? { montant_cdf: value, montant_usd: 0 } : { montant_cdf: 0, montant_usd: value }; };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== config.mdp_sortie) { setError('Mot de passe de confirmation incorrect'); return; }
    const value = Number(montant);
    if (!value || value <= 0 || !nature.trim() || !nomOperateur.trim() || !numeroOperateur.trim() || !telephoneOperateur.trim() || !beneficiaire.trim() || !numeroBeneficiaire.trim()) { setError('Veuillez remplir tous les champs obligatoires'); return; }
    const result = await addSortie({ date, nature: nature.trim(), devise, montant: value, ...amounts(), description: description.trim() || null, nom_operateur: nomOperateur.trim(), numero_operateur: numeroOperateur.trim(), telephone_operateur: telephoneOperateur.trim(), beneficiaire: beneficiaire.trim(), numero_beneficiaire: numeroBeneficiaire.trim() });
    if (!result) { setError("Erreur lors de l'enregistrement"); return; }
    generateRecuSortie(config, result); setSuccess(true); setTimeout(onBack, 1800);
  };
  if (success) return <div className="min-h-[60vh] flex items-center justify-center"><div className="text-center"><CheckCircle2 className="w-16 h-16 mx-auto text-emerald-600" /><h3 className="text-xl font-bold text-gray-800 mt-4">Sortie enregistrée</h3><p className="text-gray-500 mt-1">Le reçu PDF a été téléchargé</p></div></div>;
  return <div className="max-w-2xl mx-auto"><div className="flex items-center gap-3 mb-6"><button onClick={onBack} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ArrowLeft className="w-5 h-5 text-gray-600" /></button><h1 className="text-2xl font-bold text-gray-800">Enregistrer une Sortie</h1></div><form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
    <div><label className="field-label"><Calendar className="field-icon" /> Date</label><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field-input" /></div>
    <div><label className="field-label"><Tag className="field-icon red" /> Nature</label><input value={nature} onChange={(event) => setNature(event.target.value)} placeholder="Ex : achat, transport..." className="field-input" /></div>
    <div><label className="field-label"><DollarSign className="field-icon red" /> Devise</label><div className="flex gap-3">{(['CDF', 'USD'] as Devise[]).map((currency) => <button key={currency} type="button" onClick={() => setDevise(currency)} className={`flex-1 py-2.5 rounded-xl border font-semibold ${devise === currency ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{currency}</button>)}</div></div>
    <div><label className="block text-sm font-medium text-gray-700 mb-2">Montant ({devise})</label><input type="number" min="0" step="0.01" value={montant} onChange={(event) => setMontant(event.target.value)} className="field-input text-lg font-semibold" />{montant && Number(montant) > 0 && <p className="text-sm text-red-600 mt-1 font-medium">{formatDual(amounts().montant_cdf, amounts().montant_usd)}</p>}</div>
    <div><label className="field-label"><FileText className="field-icon red" /> Description</label><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="field-input" /></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="field-label"><User className="field-icon red" /> Nom de l'opérateur</label><input value={nomOperateur} onChange={(event) => setNomOperateur(event.target.value)} className="field-input" /></div><div><label className="field-label"><Hash className="field-icon red" /> Numéro de l'opérateur</label><input value={numeroOperateur} onChange={(event) => setNumeroOperateur(event.target.value)} className="field-input" /></div></div>
    <div><label className="field-label"><Phone className="field-icon red" /> Téléphone</label><input type="tel" value={telephoneOperateur} onChange={(event) => setTelephoneOperateur(event.target.value)} className="field-input" /></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="field-label"><User className="field-icon red" /> Bénéficiaire</label><input value={beneficiaire} onChange={(event) => setBeneficiaire(event.target.value)} className="field-input" /></div><div><label className="field-label"><Hash className="field-icon red" /> Numéro bénéficiaire</label><input value={numeroBeneficiaire} onChange={(event) => setNumeroBeneficiaire(event.target.value)} className="field-input" /></div></div>
    <div><label className="field-label"><Lock className="field-icon red" /> Mot de passe de confirmation</label><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" /></div>
    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}<div className="flex gap-3"><button type="submit" className="flex-1 py-3 bg-red-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Enregistrer</button><button type="button" onClick={onBack} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl flex items-center justify-center gap-2"><X className="w-5 h-5" /> Annuler</button></div>
  </form></div>;
}
