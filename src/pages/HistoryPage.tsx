import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDual, formatCdf, formatUsd, formatDateShort, formatDate, MONTH_NAMES } from '@/utils/format';
import type { EntreeWithCategorie, Sortie, Reversement, Config } from '@/types';

function header(doc: jsPDF, config: Config, subtitle: string) {
  doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text(config.nom_communaute, 105, 18, { align: 'center' });
  doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.text(config.paroisse, 105, 25, { align: 'center' });
  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.text(subtitle, 105, 34, { align: 'center' });
  doc.setLineWidth(0.5); doc.line(14, 38, 196, 38);
}
function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Édité le ${formatDate(new Date())} - Page ${i}/${pageCount}`, 105, 290, { align: 'center' });
    doc.text('Approuvé par le pasteur Kameya Kaboyi Josué', 105, 296, { align: 'center' });
  }
}
function receipt(doc: jsPDF, config: Config, title: string, rows: [string, string][], color: [number, number, number], filename: string) {
  header(doc, config, title);
  autoTable(doc, { startY: 50, head: [['Champ', 'Valeur']], body: rows, theme: 'striped', headStyles: { fillColor: color, fontSize: 11 }, bodyStyles: { fontSize: 10 }, margin: { left: 14, right: 14 } });
  footer(doc); doc.save(filename);
}
export function generateRecuEntree(config: Config, entree: EntreeWithCategorie, categorieNom: string) {
  const doc = new jsPDF();
  receipt(doc, config, "REÇU D'ENTRÉE", [
    ['N° Reçu', `ENT-${entree.id.toString().padStart(6, '0')}`],
    ['Date', formatDateShort(entree.date)],
    ['Culte / Service', entree.culte],
    ['Catégorie', categorieNom],
    ['Bénéficiaire', entree.beneficiaire || '—'],
    ['N° Bénéficiaire', entree.numero_beneficiaire || '—'],
    ['Caisse', entree.devise],
    ['Montant', entree.devise === 'CDF' ? formatCdf(entree.montant_cdf) : formatUsd(entree.montant_usd)],
    ['Note', entree.note || '—'],
  ], [22, 101, 52], `recu_entree_${entree.id}.pdf`);
}
export function generateRecuSortie(config: Config, sortie: Sortie) {
  const doc = new jsPDF();
  receipt(doc, config, 'REÇU DE SORTIE', [
    ['N° Reçu', `SORT-${sortie.id.toString().padStart(6, '0')}`], ['Date', formatDateShort(sortie.date)], ['Nature du décaissement', sortie.nature], ['Caisse', sortie.devise], ['Montant', sortie.devise === 'CDF' ? formatCdf(sortie.montant_cdf) : formatUsd(sortie.montant_usd)], ['Description', sortie.description || '—'], ['Opérateur', sortie.nom_operateur], ['Téléphone', sortie.telephone_operateur],
  ], [185, 28, 28], `recu_sortie_${sortie.id}.pdf`);
}
export function generateRecuReversement(config: Config, reversement: Reversement, label: string) {
  const doc = new jsPDF();
  const lines: [string, string][] = [['N° Reçu', `REV-${reversement.id.toString().padStart(6, '0')}`], ['Type', label], ['Date', formatDateShort(reversement.date_reversement)]];
  if (reversement.montant_cdf > 0) lines.push(['Caisse CDF', formatCdf(reversement.montant_cdf)]);
  if (reversement.montant_usd > 0) lines.push(['Caisse USD', formatUsd(reversement.montant_usd)]);
  lines.push(['Période', reversement.periode_debut && reversement.periode_fin ? `${formatDateShort(reversement.periode_debut)} - ${formatDateShort(reversement.periode_fin)}` : '—']);
  receipt(doc, config, 'REÇU DE REVERSEMENT', lines, [180, 83, 9], `recu_reversement_${reversement.id}.pdf`);
}
interface ReportData { title: string; periodeLabel: string; year: number; entrees: EntreeWithCategorie[]; sorties: Sortie[]; reversements: Reversement[]; totalEntreesCdf: number; totalEntreesUsd: number; totalSortiesCdf: number; totalSortiesUsd: number; totalReversementsCdf: number; totalReversementsUsd: number; soldeCdf: number; soldeUsd: number; }
export function generateReport(config: Config, data: ReportData) {
  const doc = new jsPDF();
  header(doc, config, data.title);
  doc.setFontSize(10); doc.setFont('helvetica', 'italic');
  doc.text(`Période: ${data.periodeLabel}`, 105, 44, { align: 'center' });
  doc.text(`Année: ${data.year}`, 105, 49, { align: 'center' });
  let y = 56;
  const parCategorieCdf = new Map<string, number>();
  const parCategorieUsd = new Map<string, number>();
  for (const e of data.entrees) { const nom = e.categorie_nom || '—'; parCategorieCdf.set(nom, (parCategorieCdf.get(nom) || 0) + e.montant_cdf); parCategorieUsd.set(nom, (parCategorieUsd.get(nom) || 0) + e.montant_usd); }
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('ENTRÉES', 14, y); y += 4;
  autoTable(doc, { startY: y, head: [['Date', 'Culte', 'Catégorie', 'Bénéficiaire', 'N° Bénéficiaire', 'Caisse', 'Montant', 'Note']], body: data.entrees.map((e) => [formatDateShort(e.date), e.culte, e.categorie_nom || '—', e.beneficiaire || '—', e.numero_beneficiaire || '—', e.devise, e.devise === 'CDF' ? formatCdf(e.montant_cdf) : formatUsd(e.montant_usd), e.note || '—']), theme: 'striped', headStyles: { fillColor: [22, 101, 52], fontSize: 8 }, bodyStyles: { fontSize: 7 }, margin: { left: 14, right: 14 } });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10; doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.text('Résumé par catégorie', 14, y); y += 4;
  autoTable(doc, { startY: y, head: [['Catégorie', 'Caisse CDF', 'Caisse USD']], body: Array.from(parCategorieCdf.entries()).map(([nom]) => [nom, formatCdf(parCategorieCdf.get(nom) || 0), formatUsd(parCategorieUsd.get(nom) || 0)]), theme: 'striped', headStyles: { fillColor: [22,101,52], fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10; doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('SORTIES', 14, y); y += 4;
  autoTable(doc, { startY: y, head: [['Date', 'Nature', 'Caisse', 'Montant', 'Description', 'Opérateur']], body: data.sorties.map((s) => [formatDateShort(s.date), s.nature, s.devise, s.devise === 'CDF' ? formatCdf(s.montant_cdf) : formatUsd(s.montant_usd), s.description || '—', `${s.nom_operateur} (${s.telephone_operateur})`]), foot: [['', 'Total Sorties', '', `${formatCdf(data.totalSortiesCdf)} | ${formatUsd(data.totalSortiesUsd)}`, '', '']], theme: 'striped', headStyles: { fillColor: [185,28,28], fontSize: 9 }, bodyStyles: { fontSize: 8 }, footStyles: { fillColor: [185,28,28], fontSize: 9, textColor: [255,255,255] }, margin: { left: 14, right: 14 } });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10; if (data.reversements.length > 0) { doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('REVERSEMENTS', 14, y); y += 4; autoTable(doc, { startY: y, head: [['Date', 'Type', 'Caisse CDF', 'Caisse USD', 'Période']], body: data.reversements.map((r) => [formatDateShort(r.date_reversement), r.type === 'communaute_centrale' ? 'Communauté Centrale (20%)' : 'Apôtre (10%)', formatCdf(r.montant_cdf), formatUsd(r.montant_usd), r.periode_debut && r.periode_fin ? `${formatDateShort(r.periode_debut)} - ${formatDateShort(r.periode_fin)}` : '—']), foot: [['', 'Total Reversements', formatCdf(data.totalReversementsCdf), formatUsd(data.totalReversementsUsd), '']], theme: 'striped', headStyles: { fillColor: [180,83,9], fontSize: 9 }, bodyStyles: { fontSize: 8 }, footStyles: { fillColor: [180,83,9], fontSize: 9, textColor: [255,255,255] }, margin: { left: 14, right: 14 } }); y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10; }
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text('SYNTHÈSE', 14, y); y += 4; autoTable(doc, { startY: y, head: [['Indicateur', 'Caisse CDF', 'Caisse USD']], body: [['Total Entrées', formatCdf(data.totalEntreesCdf), formatUsd(data.totalEntreesUsd)], ['Total Sorties', formatCdf(data.totalSortiesCdf), formatUsd(data.totalSortiesUsd)], ['Total Reversements', formatCdf(data.totalReversementsCdf), formatUsd(data.totalReversementsUsd)], ['Solde Net en Caisse', formatCdf(data.soldeCdf), formatUsd(data.soldeUsd)]], theme: 'grid', headStyles: { fillColor: [30,58,95], fontSize: 10 }, bodyStyles: { fontSize: 10 }, margin: { left: 14, right: 14 } });
  footer(doc); doc.save(`rapport_${data.title.replace(/\s/g, '_').toLowerCase()}.pdf`);
}
export { MONTH_NAMES };
