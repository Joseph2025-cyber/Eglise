import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { useFinance } from '@/hooks/useFinance';
import type { Config, EntreeWithCategorie, Reversement, Sortie } from '@/types';
import { generateReport } from '@/services/pdf';

interface ReportsPageProps { config: Config; onBack: () => void; }

type ReportRange = 'day' | 'week' | 'month' | 'quarter' | 'year';
const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function getWeekRange(date: string) { const d = new Date(`${date}T00:00:00`); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const monday = new Date(d); monday.setDate(diff); const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); return { start: monday.toISOString().slice(0, 10), end: sunday.toISOString().slice(0, 10) }; }
function getMonthRange(year: number, month: number) { return { start: `${year}-${String(month + 1).padStart(2, '0')}-01`, end: new Date(year, month + 1, 0).toISOString().slice(0, 10) }; }
function getQuarterRange(year: number, quarter: number) { const startMonth = (quarter - 1) * 3; return { start: `${year}-${String(startMonth + 1).padStart(2, '0')}-01`, end: new Date(year, startMonth + 3, 0).toISOString().slice(0, 10) }; }
function getYearRange(year: number) { return { start: `${year}-01-01`, end: `${year}-12-31` }; }
function getDateLabel(date: string) { return new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

export function ReportsPage({ config, onBack }: ReportsPageProps) {
  const { getEntrees, getSorties, getReversements, getExercice } = useFinance();
  const [selectedRange, setSelectedRange] = useState<ReportRange>('day');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0, 10));
  const [weekDate, setWeekDate] = useState(new Date().toISOString().slice(0, 10));
  const [monthIndex, setMonthIndex] = useState(new Date().getMonth());
  const [quarterIndex, setQuarterIndex] = useState(Math.floor(new Date().getMonth() / 3) + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [reportYears, setReportYears] = useState<number[]>([new Date().getFullYear()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { getExercice(currentYear).then((row) => { if (!row) setReportYears((prev) => Array.from(new Set([...prev, currentYear])).sort((a, b) => a - b)); }); }, [currentYear, getExercice]);

  const buildReport = async (start: string, end: string, title: string, periodLabel: string, year: number) => {
    setLoading(true); setError(null);
    try {
      const [entrees, sorties, reversements] = await Promise.all([getEntrees(start, end), getSorties(start, end), getReversements(start, end)]);
      const totalEntreesCdf = entrees.reduce((sum, item) => sum + Number(item.montant_cdf || 0), 0);
      const totalEntreesUsd = entrees.reduce((sum, item) => sum + Number(item.montant_usd || 0), 0);
      const totalSortiesCdf = sorties.reduce((sum, item) => sum + Number(item.montant_cdf || 0), 0);
      const totalSortiesUsd = sorties.reduce((sum, item) => sum + Number(item.montant_usd || 0), 0);
      const totalReversementsCdf = reversements.reduce((sum, item) => sum + Number(item.montant_cdf || 0), 0);
      const totalReversementsUsd = reversements.reduce((sum, item) => sum + Number(item.montant_usd || 0), 0);
      generateReport(config, { title, periodeLabel: periodLabel, year, entrees: entrees as EntreeWithCategorie[], sorties: sorties as Sortie[], reversements: reversements as Reversement[], totalEntreesCdf, totalEntreesUsd, totalSortiesCdf, totalSortiesUsd, totalReversementsCdf, totalReversementsUsd, soldeCdf: totalEntreesCdf - totalSortiesCdf - totalReversementsCdf, soldeUsd: totalEntreesUsd - totalSortiesUsd - totalReversementsUsd });
    } catch { setError('Une erreur est survenue lors de la génération du rapport.'); } finally { setLoading(false); }
  };

  const generateDaily = () => { void buildReport(dailyDate, dailyDate, `Rapport Journalier ${dailyDate}`, `Journalier - ${getDateLabel(dailyDate)}`, Number(dailyDate.slice(0, 4))); };
  const generateWeekly = () => { const { start, end } = getWeekRange(weekDate); void buildReport(start, end, `Rapport Hebdomadaire ${start} - ${end}`, `Hebdomadaire - ${start} / ${end}`, currentYear); };
  const generateMonthly = () => { const { start, end } = getMonthRange(currentYear, monthIndex); void buildReport(start, end, `Rapport Mensuel ${MONTH_NAMES[monthIndex]}`, `Mensuel - ${MONTH_NAMES[monthIndex]} ${currentYear}`, currentYear); };
  const generateQuarterly = () => { const { start, end } = getQuarterRange(currentYear, quarterIndex); void buildReport(start, end, `Rapport Trimestriel ${quarterIndex}`, `Trimestriel - ${quarterIndex} ${currentYear}`, currentYear); };
  const generateAnnual = () => { const { start, end } = getYearRange(currentYear); void buildReport(start, end, `Rapport Annuel ${currentYear}`, `Annuel - ${currentYear}`, currentYear); };
  const actions = { day: generateDaily, week: generateWeekly, month: generateMonthly, quarter: generateQuarterly, year: generateAnnual };

  const reportHeader = useMemo(() => <div className="mb-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-5 text-center shadow-sm"><h2 className="text-3xl font-black uppercase tracking-wide text-emerald-900">EGLISE GLOIRE DE DIEU a.s.b.l</h2><p className="mt-2 text-sm font-medium text-gray-700">Arrêté Ministériel N° 309/CAB/MIN/J/2006/du 18 Septembre 2006FG 96/4384</p><p className="mt-3 text-lg font-semibold italic text-blue-600">« Ne t'ai-je pas dit que si tu crois tu verras la gloire de Dieu »</p><p className="mt-1 text-sm text-gray-600">Jn 11 :40, 1Thess 5 :23, Ezechiel 17 :22-24, Habakuk 2 :1-4, Aggée 2 :1-9</p><p className="mt-3 text-xl font-black uppercase tracking-[0.2em] text-red-600">PAROISSE DE KYESHERO</p></div>, []);

  return <div className="mx-auto max-w-5xl"><div className="mb-5 flex items-center gap-3"><button type="button" onClick={onBack} className="rounded-xl bg-gray-100 p-2.5"><ArrowLeft className="h-5 w-5 text-gray-600" /></button><div><h1 className="text-xl font-bold text-gray-800">Rapports financiers</h1><p className="text-sm text-gray-500">Génération complète des rapports détaillés et archivés</p></div></div>{reportHeader}{error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="mb-5 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-center gap-2"><div className="flex flex-wrap gap-2">{([['day', 'Journalier'], ['week', 'Hebdomadaire'], ['month', 'Mensuel'], ['quarter', 'Trimestriel'], ['year', 'Annuel']] as [ReportRange, string][]).map(([value, label]) => <button type="button" key={value} onClick={() => setSelectedRange(value)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${selectedRange === value ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{label}</button>)}</div><label className="ml-auto text-sm font-medium text-gray-700">Année <select value={currentYear} onChange={(e) => setCurrentYear(Number(e.target.value))} className="ml-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">{Array.from(new Set([...reportYears, currentYear, currentYear - 1, currentYear - 2])).sort((a, b) => a - b).map((year) => <option key={year} value={year}>{year}</option>)}</select></label></div><div className="mt-4 flex flex-wrap items-center gap-3">{selectedRange === 'day' && <><label className="text-sm font-medium">Date</label><input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" /></>}{selectedRange === 'week' && <><label className="text-sm font-medium">Semaine</label><input type="date" value={weekDate} onChange={(e) => setWeekDate(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm" /></>}{selectedRange === 'month' && <><label className="text-sm font-medium">Mois</label><select value={monthIndex} onChange={(e) => setMonthIndex(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">{MONTH_NAMES.map((month, index) => <option key={month} value={index}>{month}</option>)}</select></>}{selectedRange === 'quarter' && <><label className="text-sm font-medium">Trimestre</label><select value={quarterIndex} onChange={(e) => setQuarterIndex(Number(e.target.value))} className="rounded-lg border border-gray-300 px-3 py-2 text-sm"><option value={1}>Trimestre 1</option><option value={2}>Trimestre 2</option><option value={3}>Trimestre 3</option><option value={4}>Trimestre 4</option></select></>}{selectedRange === 'year' && <span className="text-sm text-gray-600">Rapport complet de l'année {currentYear}</span>}<button type="button" onClick={actions[selectedRange]} disabled={loading} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Download className="mr-2 inline h-4 w-4" />{loading ? 'Génération...' : 'Générer le rapport'}</button></div></div></div>;
}

// Compatibility export expected by App.tsx.
export const Reports = ReportsPage;
