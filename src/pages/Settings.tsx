import { useState } from 'react';
import { ArrowLeft, Save, Settings as SettingsIcon, Lock, Church, Calendar, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { Config } from '@/types';
import { useConfig } from '@/hooks/useConfig';
import { useFinance } from '@/hooks/useFinance';

interface SettingsPageProps { config: Config; onBack: () => void; onConfigChange: () => void; }

export function SettingsPage({ config, onBack, onConfigChange }: SettingsPageProps) {
  const { updateConfig } = useConfig();
  const { getAllEntrees, getAllSorties, getAllReversements, deleteAllEntrees, deleteAllSorties, deleteAllReversements, archiveExercice } = useFinance();
  const [nomCommunaute, setNomCommunaute] = useState(config.nom_communaute);
  const [paroisse, setParoisse] = useState(config.paroisse);
  const [mdpAcces, setMdpAcces] = useState(config.mdp_acces);
  const [mdpSortie, setMdpSortie] = useState(config.mdp_sortie);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newYear, setNewYear] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const { error: err } = await updateConfig({ nom_communaute: nomCommunaute, paroisse, mdp_acces: mdpAcces, mdp_sortie: mdpSortie });
    setSaving(false);
    if (err) setError("Erreur lors de l'enregistrement");
    else { setSaved(true); onConfigChange(); setTimeout(() => setSaved(false), 3000); }
  };

  const handleNewExercice = async () => {
    setSaving(true); setError(null);
    const year = config.exercice_en_cours;
    const [entrees, sorties, reversements] = await Promise.all([getAllEntrees(), getAllSorties(), getAllReversements()]);
    await archiveExercice(year, entrees.reduce((s, e) => s + e.montant_cdf, 0), sorties.reduce((s, x) => s + x.montant_cdf, 0), reversements.reduce((s, r) => s + r.montant_cdf, 0), JSON.stringify({ entrees, sorties, reversements }));
    await Promise.all([deleteAllEntrees(), deleteAllSorties(), deleteAllReversements()]);
    await updateConfig({ exercice_en_cours: year + 1 });
    setSaving(false); setNewYear(true); onConfigChange(); setTimeout(() => setNewYear(false), 3000);
  };

  return <div className="max-w-2xl mx-auto">
    <div className="flex items-center gap-3 mb-6"><button onClick={onBack} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"><ArrowLeft className="w-5 h-5 text-gray-600" /></button><h1 className="text-2xl font-bold text-gray-800">Paramètres</h1></div>
    {saved && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5" /><span className="text-sm">Paramètres enregistrés avec succès</span></div>}
    {newYear && <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5" /><span className="text-sm">Nouvel exercice démarré. Les données précédentes ont été archivées.</span></div>}
    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
    <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100"><SettingsIcon className="w-5 h-5 text-gray-600" /><h2 className="font-bold text-gray-800">Configuration générale</h2></div>
      <label className="block text-sm font-medium text-gray-700">Nom de la communauté<input value={nomCommunaute} onChange={e => setNomCommunaute(e.target.value)} className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl" /></label>
      <label className="block text-sm font-medium text-gray-700">Paroisse locale<input value={paroisse} onChange={e => setParoisse(e.target.value)} className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl" /></label>
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">CDF et USD sont deux caisses indépendantes. Aucun taux de change ni conversion n'est utilisé.</div>
      <label className="block text-sm font-medium text-gray-700">Exercice en cours<div className="mt-2 flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50"><Calendar className="w-4 h-4" />{config.exercice_en_cours}</div></label>
      <div className="pt-3 border-t border-gray-100"><div className="flex items-center gap-2 mb-4"><Lock className="w-5 h-5" /><h2 className="font-bold text-gray-800">Sécurité</h2></div><div className="space-y-4"><label className="block text-sm font-medium text-gray-700">Mot de passe d'accès<input value={mdpAcces} onChange={e => setMdpAcces(e.target.value)} className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl" /></label><label className="block text-sm font-medium text-gray-700">Mot de passe de confirmation des sorties<input value={mdpSortie} onChange={e => setMdpSortie(e.target.value)} className="mt-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl" /></label></div></div>
      <button type="submit" disabled={saving} className="w-full py-3 px-6 bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><Save className="w-5 h-5" />Enregistrer les données</button>
    </form>
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-4"><div className="flex items-center gap-2 mb-3"><RefreshCw className="w-5 h-5 text-amber-600" /><h2 className="font-bold">Nouvel exercice financier</h2></div><p className="text-sm text-gray-600 mb-4">Cette action archive toutes les données de l'exercice {config.exercice_en_cours} et démarre un nouvel exercice.</p><button onClick={handleNewExercice} disabled={saving} className="w-full py-2.5 px-4 bg-amber-600 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" />Démarrer un nouvel exercice</button></div>
  </div>;
}
