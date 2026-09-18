import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  Download, CheckCircle2, AlertTriangle, Building2, Crown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { Config, Categorie } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { formatDual, formatCdf, formatUsd, MONTH_NAMES_SHORT, getYearRange } from '@/utils/format';
import { generateRecuReversement } from '@/services/pdf';
import type { Reversement } from '@/types';

interface DashboardProps {
  config: Config;
  categories: Categorie[];
  onNavigate: (page: string) => void;
}

const PIE_COLORS = ['#16a34a', '#0891b2', '#ca8a04', '#7c3aed', '#dc2626', '#ea580c'];

export function Dashboard({ config, categories, onNavigate }: DashboardProps) {
  const { getMonthlyTotals, addReversement } = useFinance();
  const [loading, setLoading] = useState(true);
  const [categoryTotals, setCategoryTotals] = useState<{ nom: string; montant_cdf: number; montant_usd: number }[]>([]);
  const [totalGlobalCdf, setTotalGlobalCdf] = useState(0);
  const [totalGlobalUsd, setTotalGlobalUsd] = useState(0);
  const [totalCommunauteCdf, setTotalCommunauteCdf] = useState(0);
  const [totalCommunauteUsd, setTotalCommunauteUsd] = useState(0);
  const [totalApotreCdf, setTotalApotreCdf] = useState(0);
  const [totalApotreUsd, setTotalApotreUsd] = useState(0);
  const [entreesMoisCdf, setEntreesMoisCdf] = useState(0);
  const [entreesMoisUsd, setEntreesMoisUsd] = useState(0);
  const [entreesMoisPrecCdf, setEntreesMoisPrecCdf] = useState(0);
  const [sortiesMoisCdf, setSortiesMoisCdf] = useState(0);
  const [sortiesMoisUsd, setSortiesMoisUsd] = useState(0);
  const [soldeNetCdf, setSoldeNetCdf] = useState(0);
  const [soldeNetUsd, setSoldeNetUsd] = useState(0);
  const [chartData, setChartData] = useState<{ mois: string; entrees: number; sorties: number }[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [showConfirm, setShowConfirm] = useState<'communaute' | 'apotre' | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const month = new Date().getMonth();
      const { monthlyEntreesCdf, monthlyEntreesUsd, monthlySortiesCdf, monthlySortiesUsd, entrees } = await getMonthlyTotals(year);

      const totalsCdf = new Map<string, number>();
      const totalsUsd = new Map<string, number>();
      for (const e of entrees) {
        const nom = e.categorie_nom || '—';
        totalsCdf.set(nom, (totalsCdf.get(nom) || 0) + e.montant_cdf);
        totalsUsd.set(nom, (totalsUsd.get(nom) || 0) + e.montant_usd);
      }
      const catTotals = categories.map((c) => ({
        nom: c.nom,
        montant_cdf: totalsCdf.get(c.nom) || 0,
        montant_usd: totalsUsd.get(c.nom) || 0,
      }));
      setCategoryTotals(catTotals);
      const tgCdf = catTotals.reduce((s, c) => s + c.montant_cdf, 0);
      const tgUsd = catTotals.reduce((s, c) => s + c.montant_usd, 0);
      setTotalGlobalCdf(tgCdf);
      setTotalGlobalUsd(tgUsd);

      const revCats = ['Dîmes', 'Offrandes Ordinaires', 'Actions de Grâce', 'Évangélisation'];
      const baseCommunauteCdf = catTotals.filter((c) => revCats.includes(c.nom)).reduce((s, c) => s + c.montant_cdf, 0);
      const baseCommunauteUsd = catTotals.filter((c) => revCats.includes(c.nom)).reduce((s, c) => s + c.montant_usd, 0);
      setTotalCommunauteCdf(Math.round(baseCommunauteCdf * 0.2));
      setTotalCommunauteUsd(Math.round(baseCommunauteUsd * 0.2));

      const dimesCdf = catTotals.find((c) => c.nom === 'Dîmes')?.montant_cdf || 0;
      const dimesUsd = catTotals.find((c) => c.nom === 'Dîmes')?.montant_usd || 0;
      setTotalApotreCdf(Math.round(dimesCdf * 0.1));
      setTotalApotreUsd(Math.round(dimesUsd * 0.1));

      setEntreesMoisCdf(monthlyEntreesCdf[month]);
      setEntreesMoisUsd(monthlyEntreesUsd[month]);
      setEntreesMoisPrecCdf(monthlyEntreesCdf[month === 0 ? 11 : month - 1]);
      setSortiesMoisCdf(monthlySortiesCdf[month]);
      setSortiesMoisUsd(monthlySortiesUsd[month]);

      const totalAllEntreesCdf = entrees.reduce((s, e) => s + e.montant_cdf, 0);
      const totalAllEntreesUsd = entrees.reduce((s, e) => s + e.montant_usd, 0);
      const totalAllSortiesCdf = monthlySortiesCdf.reduce((s, v) => s + v, 0);
      const totalAllSortiesUsd = monthlySortiesUsd.reduce((s, v) => s + v, 0);
      setSoldeNetCdf(totalAllEntreesCdf - totalAllSortiesCdf);
      setSoldeNetUsd(totalAllEntreesUsd - totalAllSortiesUsd);

      setChartData(
        MONTH_NAMES_SHORT.map((mois, i) => ({
          mois,
          entrees: monthlyEntreesCdf[i],
          sorties: monthlySortiesCdf[i],
        })),
      );

      setPieData(catTotals.filter((c) => c.montant_cdf > 0).map((c) => ({ name: c.nom, value: c.montant_cdf })));
    } catch {
      setError('Erreur lors du chargement des données');
    }
    setLoading(false);
  }, [categories, getMonthlyTotals]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleReversement = async (type: 'communaute' | 'apotre') => {
    const montantCdf = type === 'communaute' ? totalCommunauteCdf : totalApotreCdf;
    const montantUsd = type === 'communaute' ? totalCommunauteUsd : totalApotreUsd;
    if (montantCdf <= 0 && montantUsd <= 0) {
      setError('Montant à reverser est nul');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const year = new Date().getFullYear();
    const { start, end } = getYearRange(year);
    const revType = type === 'communaute' ? 'communaute_centrale' : 'apotre';
    const result = await addReversement({
      type: revType as Reversement['type'],
      montant_cdf: montantCdf,
      montant_usd: montantUsd,
      date_reversement: today,
      periode_debut: start,
      periode_fin: end,
    });
    if (result) {
      const label = type === 'communaute' ? 'Communauté Centrale (20%)' : 'Apôtre (10%)';
      generateRecuReversement(config, result, label);
      setSuccessMsg(`Reversement de ${formatDual(montantCdf, montantUsd)} enregistré. Reçu PDF téléchargé.`);
      setShowConfirm(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setError('Erreur lors du reversement');
    }
  };

  const variation = entreesMoisPrecCdf > 0
    ? ((entreesMoisCdf - entreesMoisPrecCdf) / entreesMoisPrecCdf) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s_ease]">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-800 flex items-center gap-2">
        <Wallet className="w-4 h-4 flex-shrink-0" />
        Taux de change: 1 USD = {new Intl.NumberFormat('fr-FR').format(config.taux_usd_cdf || 2800)} CDF
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            {entreesMoisPrecCdf > 0 && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${variation >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Entrées du mois</p>
          <p className="text-sm font-bold text-gray-800 mt-1">{formatDual(entreesMoisCdf, entreesMoisUsd)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Sorties du mois</p>
          <p className="text-sm font-bold text-gray-800 mt-1">{formatDual(sortiesMoisCdf, sortiesMoisUsd)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Solde net en caisse</p>
          <p className="text-sm font-bold text-gray-800 mt-1">{formatDual(soldeNetCdf, soldeNetUsd)}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">Total global des entrées</p>
          <p className="text-sm font-bold text-gray-800 mt-1">{formatDual(totalGlobalCdf, totalGlobalUsd)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Totaux par catégorie</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">Catégorie</th>
                <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Montant CDF</th>
                <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">Montant USD</th>
              </tr>
            </thead>
            <tbody>
              {categoryTotals.map((cat, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm text-gray-700">{cat.nom}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold text-gray-800">{formatCdf(cat.montant_cdf)}</td>
                  <td className="px-5 py-3 text-sm text-right font-semibold text-gray-800">{formatUsd(cat.montant_usd)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-200 bg-gray-50">
                <td className="px-5 py-3 text-sm font-bold text-gray-800">Total Global</td>
                <td className="px-5 py-3 text-sm text-right font-bold text-emerald-700">{formatCdf(totalGlobalCdf)}</td>
                <td className="px-5 py-3 text-sm text-right font-bold text-emerald-700">{formatUsd(totalGlobalUsd)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl border border-teal-100 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Communauté Centrale</h3>
              <p className="text-xs text-gray-500">20% (Dîmes + Offrandes Ord. + Actions de Grâce + Évangélisation)</p>
            </div>
          </div>
          <p className="text-lg font-bold text-teal-700 mb-4">{formatDual(totalCommunauteCdf, totalCommunauteUsd)}</p>
          <button
            onClick={() => setShowConfirm('communaute')}
            disabled={totalCommunauteCdf <= 0 && totalCommunauteUsd <= 0}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" /> Décaisser
          </button>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Apôtre</h3>
              <p className="text-xs text-gray-500">10% des Dîmes uniquement</p>
            </div>
          </div>
          <p className="text-lg font-bold text-amber-700 mb-4">{formatDual(totalApotreCdf, totalApotreUsd)}</p>
          <button
            onClick={() => setShowConfirm('apotre')}
            disabled={totalApotreCdf <= 0 && totalApotreUsd <= 0}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" /> Décaisser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Évolution mensuelle (Recettes vs Dépenses) — CDF</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCdf(Number(v))} />
              <Legend />
              <Line type="monotone" dataKey="entrees" stroke="#16a34a" strokeWidth={2} name="Recettes" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="sorties" stroke="#dc2626" strokeWidth={2} name="Dépenses" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4">Répartition des entrées par catégorie (CDF)</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCdf(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">
              Aucune donnée à afficher
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('entry')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-emerald-200 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="font-semibold text-gray-800 text-sm">Enregistrer une Entrée</p>
          <p className="text-xs text-gray-500 mt-1">Dîmes, offrandes, dons...</p>
        </button>
        <button
          onClick={() => onNavigate('exit')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-red-200 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3 group-hover:bg-red-100 transition-colors">
            <ArrowDownRight className="w-5 h-5 text-red-600" />
          </div>
          <p className="font-semibold text-gray-800 text-sm">Enregistrer une Sortie</p>
          <p className="text-xs text-gray-500 mt-1">Décaissements</p>
        </button>
        <button
          onClick={() => onNavigate('reports')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-800 text-sm">Rapports</p>
          <p className="text-xs text-gray-500 mt-1">Télécharger les PDF</p>
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-gray-200 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
            <Wallet className="w-5 h-5 text-gray-600" />
          </div>
          <p className="font-semibold text-gray-800 text-sm">Paramètres</p>
          <p className="text-xs text-gray-500 mt-1">Configuration</p>
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Confirmer le décaissement</h3>
              <p className="text-sm text-gray-500 mt-2">
                {showConfirm === 'communaute'
                  ? `Reverser ${formatDual(totalCommunauteCdf, totalCommunauteUsd)} à la Communauté Centrale (20%)`
                  : `Reverser ${formatDual(totalApotreCdf, totalApotreUsd)} à l'Apôtre (10%)`}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleReversement(showConfirm)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm"
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
