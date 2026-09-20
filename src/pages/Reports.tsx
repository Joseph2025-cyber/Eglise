import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Download, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Config } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { MONTH_NAMES, getMonthRange, getWeekRange, getQuarterRange, getYearRange, getMondayOfDate, todayISO } from '@/utils/format';
import { generateReport } from '@/services/pdf';

interface ReportsProps { config: Config; onBack: () => void; }
type ReportType = 'weekly' | 'monthly' | 'quarterly' | 'annual' | null;

export function Reports({ config, onBack }: ReportsProps) {
  const { getEntrees, getSorties, getReversements } = useFinance();
  const [activeType, setActiveType] = useState<ReportType>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  const buildReport = async (start: string, end: string, title: string, periodeLabel: string, year: number) => {
    const [entrees, sorties, reversements] = await Promise.all([getEntrees(start, end), getSorties(start, end), getReversements(start, end)]);
    const totalEntreesCdf = entrees.reduce((s, e) => s + e.montant_cdf, 0);
    const totalEntreesUsd = entrees.reduce((s, e) => s + e.montant_usd, 0);
    const totalSortiesCdf = sorties.reduce((s, s2) => s + s2.montant_cdf, 0);
    const totalSortiesUsd = sorties.reduce((s, s2) => s + s2.montant_usd, 0);
    const totalRevCdf = reversements.reduce((s, r) => s + r.montant_cdf, 0);
    const totalRevUsd = reversements.reduce((s, r) => s + r.montant_usd, 0);
    generateReport(config, { title, periodeLabel, year, entrees, sorties, reversements, totalEntreesCdf, totalEntreesUsd, totalSortiesCdf, totalSortiesUsd, totalReversementsCdf: totalRevCdf, totalReversementsUsd: totalRevUsd });
    setSuccess('Rapport téléchargé avec succès');
    setTimeout(() => setSuccess(null), 3000);
  };

  const generateMonthly = async (month: number) => { setGenerating(true); setError(null); try { const { start, end } = getMonthRange(currentYear, month); await buildReport(start, end, `Rapport Mensuel ${MONTH_NAMES[month]}`, MONTH_NAMES[month], currentYear); } catch { setError('Erreur lors de la génération du rapport'); } finally { setGenerating(false); } };
  const generateWeekly = async (mondayDate: string) => { setGenerating(true); setError(null); try { const { start, end } = getWeekRange(mondayDate); await buildReport(start, end, 'Rapport Hebdomadaire', `${start} - ${end}`, currentYear); } catch { setError('Erreur lors de la génération du rapport'); } finally { setGenerating(false); } };
  const generateQuarterly = async (quarter: number) => { setGenerating(true); setError(null); try { const { start, end } = getQuarterRange(currentYear, quarter); await buildReport(start, end, `Rapport Trimestriel ${quarter}`, `Trimestre ${quarter}`, currentYear); } catch { setError('Erreur lors de la génération du rapport'); } finally { setGenerating(false); } };
  const generateAnnual = async (year: number) => { setGenerating(true); setError(null); try { const { start, end } = getYearRange(year); await buildReport(start, end, `Rapport Annuel ${year}`, `Année ${year}`, year); } catch { setError('Erreur lors de la génération du rapport'); } finally { setGenerating(false); } };

  const reportTypes = [
    { id: 'weekly' as const, label: 'Rapport Hebdomadaire', icon: Calendar, color: 'blue' },
    { id: 'monthly' as const, label: 'Rapport Mensuel', icon: Calendar, color: 'emerald' },
    { id: 'quarterly' as const, label: 'Rapport Trimestriel', icon: FileText, color: 'amber' },
    { id: 'annual' as const, label: 'Rapport Annuel', icon: FileText, color: 'teal' },
  ];

  const colorMap: Record<string, string> = { blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100', emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100', amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100', teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100' };
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const [weekDate, setWeekDate] = useState(todayISO());

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><button onClick={onBack} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></button><h1 className="text-2xl font-bold text-gray-800">Rapports financiers</h1></div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-medium">{success}</span></div>}
      {generating && <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /><span className="ml-3 text-gray-500">Génération en cours...</span></div>}
      {!activeType && !generating && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{reportTypes.map((rt) => <button key={rt.id} onClick={() => setActiveType(rt.id)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md hover:border-emerald-200 transition-all group"><div className="flex items-center justify-between"><div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[rt.color]}`}><rt.icon className="w-6 h-6" /></div><ChevronRight className="w-5 h-5 text-gray-400" /></div><h2 className="mt-4 text-lg font-bold text-gray-800">{rt.label}</h2></button>)}</div>}
      {activeType === 'weekly' && !generating && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-800 mb-4">Sélection de la semaine</h2><div className="space-y-4"><label className="block text-sm font-medium text-gray-700">Date du lundi</label><input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl" /><button onClick={() => generateWeekly(getMondayOfDate(weekDate))} className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold">Télécharger le rapport</button></div></div>}
      {activeType === 'monthly' && !generating && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-800 mb-4">Choisir le mois ({currentYear})</h2><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{MONTH_NAMES.map((m, idx) => <button key={m} onClick={() => generateMonthly(idx)} className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-medium">{m}</button>)}</div></div>}
      {activeType === 'quarterly' && !generating && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-800 mb-4">Choisir le trimestre</h2><div className="grid grid-cols-2 gap-3">{[1,2,3,4].map((q) => <button key={q} onClick={() => generateQuarterly(q)} className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-700 hover:text-amber-700 font-medium">Trimestre {q}</button>)}</div></div>}
      {activeType === 'annual' && !generating && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-800 mb-4">Choisir l'année</h2><div className="grid grid-cols-3 gap-3">{years.map((y) => <button key={y} onClick={() => generateAnnual(y)} className="px-3 py-2 rounded-xl bg-gray-50 hover:bg-teal-50 text-gray-700 hover:text-teal-700 font-medium">{y}</button>)}</div></div>}
    </div>
  );
}

