import { useState } from 'react';
import {
  ArrowLeft, Save, Settings as SettingsIcon, Lock, Church, Calendar, RefreshCw, CheckCircle2,
} from 'lucide-react';
import type { Config } from '@/types';
import { useConfig } from '@/hooks/useConfig';
import { useFinance } from '@/hooks/useFinance';

interface SettingsPageProps {
  config: Config;
  onBack: () => void;
  onConfigChange: () => void;
}

export function SettingsPage({ config, onBack, onConfigChange }: SettingsPageProps) {
  const { updateConfig } = useConfig();
  const { getAllEntrees, getAllSorties, getAllReversements, deleteAllEntrees, deleteAllSorties, deleteAllReversements, archiveExercice } = useFinance();
  const [nomCommunaute, setNomCommunaute] = useState(config.nom_communaute);
  const [paroisse, setParoisse] = useState(config.paroisse);
  const [devise, setDevise] = useState<'CDF' | 'USD'>(config.devise === 'USD' ? 'USD' : 'CDF');
  const [mdpAcces, setMdpAcces] = useState(config.mdp_acces);
  const [mdpSortie, setMdpSortie] = useState(config.mdp_sortie);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newYear, setNewYear] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: err } = await updateConfig({
      nom_communaute: nomCommunaute,
      paroisse,
      devise,
      mdp_acces: mdpAcces,
      mdp_sortie: mdpSortie,
    });
    setSaving(false);
    if (err) {
      setError('Erreur lors de l\'enregistrement');
    } else {
      setSaved(true);
      onConfigChange();
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleNewExercice = async () => {
    setSaving(true);
    setError(null);
    const year = config.exercice_en_cours;
    const entrees = await getAllEntrees();
    const sorties = await getAllSorties();
    const reversements = await getAllReversements();

    const totalEntrees = entrees.reduce((s, e) => s + e.montant, 0);
    const totalSorties = sorties.reduce((s, s2) => s + s2.montant, 0);
    const totalRev = reversements.reduce((s, r) => s + r.montant, 0);

    await archiveExercice(
      year,
      totalEntrees,
      totalSorties,
      totalRev,
      JSON.stringify({ entrees, sorties, reversements }),
    );

    await deleteAllEntrees();
    await deleteAllSorties();
    await deleteAllReversements();

    await updateConfig({ exercice_en_cours: year + 1 });

    setSaving(false);
    setNewYear(true);
    onConfigChange();
    setTimeout(() => setNewYear(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-4 animate-[fadeIn_0.3s_ease]">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Paramètres enregistrés avec succès</span>
        </div>
      )}
      {newYear && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-4 animate-[fadeIn_0.3s_ease]">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">Nouvel exercice démarré. Les données précédentes ont été archivées.</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <SettingsIcon className="w-5 h-5 text-gray-600" />
          <h2 className="font-bold text-gray-800">Configuration générale</h2>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Church className="w-4 h-4 text-gray-500" /> Nom de la communauté
          </label>
          <input
            type="text"
            value={nomCommunaute}
            onChange={(e) => setNomCommunaute(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Paroisse locale</label>
          <input
            type="text"
            value={paroisse}
            onChange={(e) => setParoisse(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Devise</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDevise('CDF')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                devise === 'CDF'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              } border`}
            >
              Franc Congolais (CDF)
            </button>
            <button
              type="button"
              onClick={() => setDevise('USD')}
              className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                devise === 'USD'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              } border`}
            >
              Dollar Américain (USD)
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Exercice en cours
          </label>
          <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700 font-semibold">{config.exercice_en_cours}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-gray-600" />
            <h2 className="font-bold text-gray-800">Sécurité</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Mot de passe d'accès (Dashboard)
              </label>
              <input
                type="text"
                value={mdpAcces}
                onChange={(e) => setMdpAcces(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Mot de passe de confirmation des sorties
              </label>
              <input
                type="text"
                value={mdpSortie}
                onChange={(e) => setMdpSortie(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" /> Enregistrer les données
        </button>
      </form>

      {/* New fiscal year */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-5 h-5 text-amber-600" />
          <h2 className="font-bold text-gray-800">Nouvel exercice financier</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Cette action archive toutes les données de l'exercice {config.exercice_en_cours} et démarre un
          nouvel exercice. Les totaux seront remis à zéro. Cette action est irréversible.
        </p>
        <button
          onClick={handleNewExercice}
          disabled={saving}
          className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Démarrer un nouvel exercice
        </button>
      </div>
    </div>
  );
}
