import { useState } from 'react';
import { ArrowLeft, CheckCircle2, LockKeyhole, Save, X } from 'lucide-react';
import type { Config, Devise } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { todayISO } from '@/utils/format';
import { generateRecuSortie } from '@/services/pdf';

interface ExitFormProps { config: Config; onBack: () => void; }

const fieldClass = 'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100';
const labelClass = 'mb-1.5 block text-sm font-semibold text-gray-700';

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== config.mdp_sortie) { setError('Mot de passe de confirmation incorrect'); return; }
    const value = Number(montant);
    if (!value || value <= 0 || !nature.trim() || !nomOperateur.trim() || !numeroOperateur.trim() || !telephoneOperateur.trim() || !beneficiaire.trim() || !numeroBeneficiaire.trim()) {
      setError('Veuillez remplir tous les champs obligatoires et entrer un montant valide');
      return;
    }
    const amounts = devise === 'CDF' ? { montant_cdf: value, montant_usd: 0 } : { montant_cdf: 0, montant_usd: value };
    const result = await addSortie({ date, nature: nature.trim(), devise, montant: value, ...amounts, description: description.trim() || null, nom_operateur: nomOperateur.trim(), numero_operateur: numeroOperateur.trim(), telephone_operateur: telephoneOperateur.trim(), beneficiaire: beneficiaire.trim(), numero_beneficiaire: numeroBeneficiaire.trim() });
    if (!result) { setError("Erreur lors de l'enregistrement"); return; }
    generateRecuSortie(config, result);
    setSuccess(true);
    setTimeout(onBack, 1800);
  };

  if (success) return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /><h3 className="mt-4 text-lg font-bold text-gray-800">Sortie enregistrée</h3><p className="mt-1 text-sm text-gray-500">Le reçu a été téléchargé.</p></div></div>;

  return <div className="mx-auto max-w-3xl">
    <div className="mb-5 flex items-center gap-3"><button type="button" onClick={onBack} className="rounded-xl bg-gray-100 p-2.5 transition hover:bg-gray-200"><ArrowLeft className="h-5 w-5 text-gray-600" /></button><div><h1 className="text-xl font-bold text-gray-800">Nouvelle sortie</h1><p className="text-sm text-gray-500">Enregistrer une dépense dans la caisse</p></div></div>
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div><label className={labelClass} htmlFor="exit-date">Date</label><input id="exit-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className={fieldClass} /></div>
        <div><label className={labelClass} htmlFor="exit-nature">Nature de la dépense</label><input id="exit-nature" value={nature} onChange={(event) => setNature(event.target.value)} placeholder="Ex : achat, transport..." className={fieldClass} /></div>
        <div><label className={labelClass}>Devise</label><div className="grid grid-cols-2 gap-2">{(['CDF', 'USD'] as Devise[]).map((currency) => <button key={currency} type="button" onClick={() => setDevise(currency)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${devise === currency ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'}`}>{currency}</button>)}</div></div>
        <div><label className={labelClass} htmlFor="exit-amount">Montant ({devise})</label><input id="exit-amount" type="number" min="0" step="0.01" value={montant} onChange={(event) => setMontant(event.target.value)} placeholder="0,00" className={fieldClass} /></div>
        <div className="sm:col-span-2"><label className={labelClass} htmlFor="exit-description">Description <span className="font-normal text-gray-400">(facultatif)</span></label><textarea id="exit-description" value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Décrire la dépense..." className={`${fieldClass} resize-none`} /></div>
        <div className="sm:col-span-2 border-t border-gray-100 pt-5"><h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Informations de l'opérateur</h2><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><div><label className={labelClass} htmlFor="operator-name">Nom de l'opérateur</label><input id="operator-name" value={nomOperateur} onChange={(event) => setNomOperateur(event.target.value)} className={fieldClass} /></div><div><label className={labelClass} htmlFor="operator-number">Numéro de l'opérateur</label><input id="operator-number" value={numeroOperateur} onChange={(event) => setNumeroOperateur(event.target.value)} className={fieldClass} /></div><div><label className={labelClass} htmlFor="operator-phone">Téléphone</label><input id="operator-phone" type="tel" value={telephoneOperateur} onChange={(event) => setTelephoneOperateur(event.target.value)} className={fieldClass} /></div></div></div>
        <div className="sm:col-span-2 border-t border-gray-100 pt-5"><h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">Informations du bénéficiaire</h2><div className="grid grid-cols-1 gap-5 md:grid-cols-2"><div><label className={labelClass} htmlFor="beneficiary-name">Nom du bénéficiaire</label><input id="beneficiary-name" value={beneficiaire} onChange={(event) => setBeneficiaire(event.target.value)} className={fieldClass} /></div><div><label className={labelClass} htmlFor="beneficiary-number">Numéro du bénéficiaire</label><input id="beneficiary-number" value={numeroBeneficiaire} onChange={(event) => setNumeroBeneficiaire(event.target.value)} className={fieldClass} /></div></div></div>
        <div className="sm:col-span-2"><label className={labelClass} htmlFor="exit-password">Mot de passe de confirmation</label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" /><input id="exit-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={`${fieldClass} pl-9`} /></div></div>
      </div>
      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row"><button type="button" onClick={onBack} className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"><X className="mr-2 inline h-4 w-4" />Annuler</button><button type="submit" className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700"><Save className="mr-2 inline h-4 w-4" />Enregistrer la sortie</button></div>
    </form>
  </div>;
}
