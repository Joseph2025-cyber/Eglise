import { useState } from 'react';
import { ArrowLeft, FileText, Download, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react';
import type { Config } from '@/types';
import { useFinance } from '@/hooks/useFinance';
import { MONTH_NAMES, getMonthRange, getWeekRange, getQuarterRange, getYearRange, getMondayOfDate, todayISO } from '@/utils/format';
import { generateReport } from '@/services/pdf';

interface ReportsProps { config: Config; onBack: () => void; }
type ReportType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | null;

export function Reports({ config, onBack }: ReportsProps) {
  const { getEntrees, getSorties, getReversements } = useFinance();
  const [activeType, setActiveType] = useState<ReportType>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [weekDate, setWeekDate] = useState(todayISO());
  const [dailyDate, setDailyDate] = useState(todayISO());

  const currentYear = new Date().getFullYear();

  const buildReport = async (start: string, end: string, title: string, periodeLabel: string, year: number) => {
    const [entrees, sorties, reversements] = await Promise.all([getEntrees(start, end), getSorties(start, end), getReversements(start, end)]);
    const totalEntreesCdf = entrees.reduce((sum, item) => sum + item.montant_cdf, 0);
    const totalEntreesUsd = entrees.reduce((sum, item) => sum + item.montant_usd, 0);
    const totalSortiesCdf = sorties.reduce((sum, item) => sum + item.montant_cdf, 0);
    const totalSortiesUsd = sorties.reduce((sum, item) => sum + item.montant_usd, 0);
    const totalRevCdf = reversements.reduce((sum, item) => sum + item.montant_cdf, 0);
    const totalRevUsd = reversements.reduce((sum, item) => sum + item.montant_usd, 0);
    generateReport(config, {
      title,
      periodeLabel,
      year,
      entrees,
      sorties,
      reversements,
      totalEntreesCdf,
      totalEntreesUsd,
      totalSortiesCdf,
      totalSortiesUsd,
      totalReversementsCdf: totalRevCdf,
      totalReversementsUsd: totalRevUsd,
      soldeCdf: totalEntreesCdf - totalSortiesCdf - totalRevCdf,
      soldeUsd: totalEntreesUsd - totalSortiesUsd - totalRevUsd,
    });
    setSuccess('Rapport téléchargé avec succès');
    setTimeout(() => setSuccess(null), 3000);
  };

  const run = async (action: () => Promise<void>) => {
    setGenerating(true);
    setError(null);
    try { await action(); } catch { setError('Erreur lors de la génération du rapport'); } finally { setGenerating(false); }
  };

  const generateDaily = () => run(async () => {
    await buildReport(dailyDate, dailyDate, `Rapport Journalier ${dailyDate}`, dailyDate, Number(dailyDate.slice(0, 4)));
  });
  const generateWeekly = (date: string) => run(async () => {
    const { start, end } = getWeekRange(date);
    await buildReport(start, end, 'Rapport Hebdomadaire', `${start} - ${end}`, currentYear);
  });
  const generateMonthly = (month: number) => run(async () => {
    const { start, end } = getMonthRange(currentYear, month);
    await buildReport(start, end, `Rapport Mensuel ${MONTH_NAMES[month]}`, MONTH_NAMES[month], currentYear);
  });
  const generateQuarterly = (quarter: number) => run(async () => {
    const { start, end } = getQuarterRange(currentYear, quarter);
    await buildReport(start, end, `Rapport Trimestriel ${quarter}`, `Trimestre ${quarter}`, currentYear);
  });
  const generateAnnual = (year: number) => run(async () => {
    const { start, end } = getYearRange(year);
    await buildReport(start, end, `Rapport Annuel ${year}`, `Année ${year}`, year);
  });

  const reportTypes = [
    { id: 'daily' as const, label: 'Rapport Journalier', icon: Calendar, color: 'violet' },
    { id: 'weekly' as const, label: 'Rapport Hebdomadaire', icon: Calendar, color: 'blue' },
    { id: 'monthly' as const, label: 'Rapport Mensuel', icon: Calendar, color: 'emerald' },
    { id: 'quarterly' as const, label: 'Rapport Trimestriel', icon: FileText, color: 'amber' },
    { id: 'annual' as const, label: 'Rapport Annuel', icon: FileText, color: 'teal' },
  ];
  const colorMap: Record<string, string> = {
    violet: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    teal: 'bg-teal-50 text-teal-600 group-hover:bg-teal-100',
  };
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const panel = 'bg-white rounded-xl shadow-sm border border-gray-100 p-5';
  const button = 'px-3 py-2 rounded-lg text-sm font-semibold transition-colors';

  return (
    <div className="max-w-3xl mx-auto text-sm">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"><ArrowLeft className="w-4 h-4 text-gray-600" /></button>
        <h1 className="text-xl font-bold text-gray-800">Rapports</h1>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-lg text-sm mb-3">{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-2.5 rounded-lg flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4" /><span>Rapport téléchargé avec succès</span></div>}
      {generating && <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" /><span className="ml-3 text-gray-500">Génération du rapport...</span></div>}

      {!activeType && !generating && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reportTypes.map((rt) => { const Icon = rt.icon; return <button key={rt.id} onClick={() => setActiveType(rt.id)} className="group bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md transition-shadow flex items-center gap-3"><span className={`p-2.5 rounded-lg ${colorMap[rt.color]}`}><Icon className="w-5 h-5" /></span><span className="font-semibold text-gray-800 flex-1">{rt.label}</span><ChevronRight className="w-4 h-4 text-gray-400" /></button>; })}
      </div>}

      {activeType === 'daily' && !generating && <div className={panel}><h2 className="text-base font-bold text-gray-800 mb-3">Rapport Journalier</h2><p className="text-gray-500 mb-4">Résumé de toutes les entrées, sorties et reversements de la journée.</p><div className="flex flex-wrap items-end gap-3"><label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">Date<input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal" /></label><button onClick={generateDaily} className={`${button} bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2`}><Download className="w-4 h-4" /> Télécharger</button><button onClick={() => setActiveType(null)} className={`${button} bg-gray-100 hover:bg-gray-200 text-gray-700`}>Retour</button></div></div>}
      {activeType === 'weekly' && !generating && <div className={panel}><h2 className="text-base font-bold text-gray-800 mb-3">Sélection de la semaine</h2><div className="flex flex-wrap items-end gap-3"><label className="flex flex-col gap-1 text-xs font-semibold text-gray-600">Date de référence<input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-normal" /></label><button onClick={() => generateWeekly(weekDate)} className={`${button} bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2`}><Download className="w-4 h-4" /> Télécharger</button><button onClick={() => setActiveType(null)} className={`${button} bg-gray-100 text-gray-700`}>Retour</button></div></div>}
      {activeType === 'monthly' && !generating && <div className={panel}><h2 className="text-base font-bold text-gray-800 mb-3">Choisir le mois ({currentYear})</h2><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{MONTH_NAMES.map((month, i) => <button key={month} onClick={() => generateMonthly(i)} className={`${button} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center gap-1`}><Download className="w-3.5 h-3.5" />{month}</button>)}</div><button onClick={() => setActiveType(null)} className={`${button} bg-gray-100 text-gray-700 mt-4`}>Retour</button></div>}
      {activeType === 'quarterly' && !generating && <div className={panel}><h2 className="text-base font-bold text-gray-800 mb-3">Choisir le trimestre ({currentYear})</h2><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{[1, 2, 3, 4].map((quarter) => <button key={quarter} onClick={() => generateQuarterly(quarter)} className={`${button} bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center justify-center gap-1`}><Download className="w-3.5 h-3.5" />T{quarter}</button>)}</div><button onClick={() => setActiveType(null)} className={`${button} bg-gray-100 text-gray-700 mt-4`}>Retour</button></div>}
      {activeType === 'annual' && !generating && <div className={panel}><h2 className="text-base font-bold text-gray-800 mb-3">Choisir l'année</h2><div className="flex flex-wrap gap-2">{years.map((year) => <button key={year} onClick={() => generateAnnual(year)} className={`${button} bg-teal-50 text-teal-700 hover:bg-teal-100 flex items-center gap-1`}><Download className="w-3.5 h-3.5" />{year}</button>)}</div><button onClick={() => setActiveType(null)} className={`${button} bg-gray-100 text-gray-700 mt-4`}>Retour</button></div>}
    </div>
  );
}
