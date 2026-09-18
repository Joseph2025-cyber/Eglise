import { useState } from 'react';
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
    generateReport(config, { title, periodeLabel, year, entrees, sorties, reversements, totalEntreesCdf, totalEntreesUsd, totalSortiesCdf, totalSortiesUsd, totalReversementsCdf: totalRevCdf, totalReversementsUsd: totalRevUsd, soldeCdf: totalEntreesCdf - totalSortiesCdf - totalRevCdf, soldeUsd: totalEntreesUsd - totalSortiesUsd - totalRevUsd });
    setSuccess('Rapport téléchargé avec succès');
    setTimeout(() => setSuccess(null), 3000);
  };

  const generateMonthly = async (month: number) => { setGenerating(true); setError(null); try { const { start, end } = getMonthRange(currentYear, month); await buildReport(start, end, `Rapport Mensuel - ${MONTH_NAMES[month]} ${currentYear}`, `${MONTH_NAMES[month]} ${currentYear}`, currentYear); } catch { setError('Erreur lors de la génération du rapport'); } setGenerating(false); };
  const generateWeekly = async (mondayDate: string) => { setGenerating(true); setError(null); try { const { start, end } = getWeekRange(mondayDate); await buildReport(start, end, 'Rapport Hebdomadaire', `${start} - ${end}`, currentYear); } catch { setError('Erreur lors de la génération du rapport'); } setGenerating(false); };
  const generateQuarterly = async (quarter: number) => { setGenerating(true); setError(null); try { const { start, end } = getQuarterRange(currentYear, quarter); await buildReport(start, end, `Rapport Trimestriel - T${quarter} ${currentYear}`, `T${quarter} ${currentYear}`, currentYear); } catch { setError('Erreur lors de la génération du rapport'); } setGenerating(false); };
  const generateAnnual = async (year: number) => { setGenerating(true); setError(null); try { const { start, end } = getYearRange(year); await buildReport(start, end, `Rapport Annuel ${year}`, `Année ${year}`, year); } catch { setError('Erreur lors de la génération du rapport'); } setGenerating(false); };

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
      <div className="flex items-center gap-3 mb-6"><button onClick={onBack} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"><ArrowLeft className="w-5 h-5 text-gray-600" /></button><h1 className="text-2xl font-bold text-gray-800">Rapports et Statistiques</h1></div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 mb-4"><CheckCircle2 className="w-5 h-5" /><span className="text-sm font-medium">{success}</span></div>}
      {generating && <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" /><span className="ml-3 text-gray-500 text-sm">Génération du PDF...</span></div>}
      {!activeType && !generating && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{reportTypes.map((rt) => <button key={rt.id} onClick={() => setActiveType(rt.id)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-left hover:shadow-md transition-all group"><div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${colorMap[rt.color]}`}><rt.icon className="w-5 h-5" /></div><p className="font-semibold text-gray-800 text-sm">{rt.label}</p><p className="text-xs text-gray-500 mt-1">Télécharger en PDF</p><ChevronRight className="w-4 h-4 text-gray-400 mt-2 group-hover:text-gray-600 transition-colors" /></button>)}</div>}
      {activeType === 'weekly' && !generating && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-800 mb-4">Sélection de la semaine</h2><p className="text-sm text-gray-500 mb-4">Cliquez sur un jour de la semaine souhaitée (la semaine sera calculée du lundi au dimanche).</p><input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all mb-4" /><p className="text-sm text-gray-600 mb-4">Semaine du: <span className="font-semibold">{getMondayOfDate(weekDate)}</span> au <span className="font-semibold">{getWeekRange(getMondayOfDate(weekDate)).end}</span></p><div className="flex gap-3"><button onClick={() => generateWeekly(getMondayOfDate(weekDate))} className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"><Download className="w-5 h-5" /> Télécharger</button><button onClick={() => setActiveType(null)} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all">Retour</button></div></div>}
      {activeType === 'monthly' && !generating && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-800 mb-4">Choisir le mois ({currentYear})</h2><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{MONTH_NAMES.map((month, i) => <button key={i} onClick={() => generateMonthly(i)} className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2"><Download className="w-4 h-4" /> {month}</button>)}</div><button onClick={() => setActiveType(null)} className="mt-4 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-sm">Retour</button></div>}
      {activeType === 'quarterly' && !generating && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-800 mb-4">Choisir le trimestre ({currentYear})</h2><div className="grid grid-cols-2 gap-3">{[1,2,3,4].map((q) => <button key={q} onClick={() => generateQuarterly(q)} className="py-4 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Trimestre {q}</button>)}</div><button onClick={() => setActiveType(null)} className="mt-4 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-sm">Retour</button></div>}
      {activeType === 'annual' && !generating && <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"><h2 className="text-lg font-bold text-gray-800 mb-4">Choisir l'année</h2><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{years.map((y) => <button key={y} onClick={() => generateAnnual(y)} className="py-4 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2"><Download className="w-4 h-4" /> {y}</button>)}</div><button onClick={() => setActiveType(null)} className="mt-4 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all text-sm">Retour</button></div>}
    </div>
  );
}
