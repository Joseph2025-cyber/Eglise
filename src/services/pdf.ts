import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCdf, formatUsd, formatDate, formatDateShort } from '@/utils/format';
import type { Config, EntreeWithCategorie, Reversement, Sortie } from '@/types';

function officialHeader(doc: jsPDF, subtitle: string) {
  const center = 105;
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('EGLISE GLOIRE DE DIEU a.s.b.l', center, 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Arrêté Ministériel N° 309/CAB/MIN/J/2006/du 18 Septembre 2006FG 96/4384', center, 21, { align: 'center' });

  doc.setTextColor(30, 92, 170);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10.5);
  doc.text("« Ne t'ai-je pas dit que si tu crois tu verras la gloire de Dieu »", center, 29, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Jn 11 :40, 1Thess 5 :23, Ezechiel 17 :22-24, Habakuk 2 :1-4, Aggée 2 :1-9', center, 36, { align: 'center' });

  doc.setTextColor(190, 35, 35);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('PAROISSE DE KYESHERO', center, 45, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(subtitle, center, 56, { align: 'center' });
  doc.setDrawColor(150, 150, 150);
  doc.line(14, 61, 196, 61);
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Édité le ${formatDate(new Date())} - Page ${page}/${pages}`, 105, 290, { align: 'center' });
    doc.text('Approuvé par le pasteur Kameya Kaboyi Josué', 105, 296, { align: 'center' });
  }
}

function receipt(doc: jsPDF, config: Config, title: string, rows: [string, string][], color: [number, number, number], filename: string) {
  officialHeader(doc, title);
  autoTable(doc, {
    startY: 70,
    head: [['Champ', 'Valeur']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: color, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14, bottom: 22 },
  });
  footer(doc);
  doc.save(filename);
}

export function generateRecuEntree(config: Config, entree: EntreeWithCategorie, categorieNom: string) {
  const doc = new jsPDF();
  receipt(doc, config, "REÇU D'ENTRÉE", [
    ['N° Reçu', `ENT-${entree.id.toString().padStart(6, '0')}`],
    ['Date', formatDateShort(entree.date)],
    ['Culte / Service', entree.culte],
    ['Nature', categorieNom],
    ['Caisse', entree.devise],
    ['Montant', entree.devise === 'CDF' ? formatCdf(entree.montant_cdf) : formatUsd(entree.montant_usd)],
    ['Note', entree.note || '—'],
  ], [22, 101, 52], `recu_entree_${entree.id}.pdf`);
}

export function generateRecuSortie(config: Config, sortie: Sortie) {
  const doc = new jsPDF();
  receipt(doc, config, 'REÇU DE SORTIE', [
    ['N° Reçu', `SORT-${sortie.id.toString().padStart(6, '0')}`],
    ['Date', formatDateShort(sortie.date)],
    ['Nature', sortie.nature],
    ['Caisse', sortie.devise],
    ['Montant', sortie.devise === 'CDF' ? formatCdf(sortie.montant_cdf) : formatUsd(sortie.montant_usd)],
    ['Description', sortie.description || '—'],
    ["Nom de l'opérateur", sortie.nom_operateur],
    ["Numéro de l'opérateur", sortie.numero_operateur || '—'],
    ['Bénéficiaire', sortie.beneficiaire || '—'],
    ['N° bénéficiaire', sortie.numero_beneficiaire || '—'],
  ], [185, 28, 28], `recu_sortie_${sortie.id}.pdf`);
}

export function generateRecuReversement(config: Config, reversement: Reversement, label: string) {
  const doc = new jsPDF();
  const rows: [string, string][] = [
    ['N° Reçu', `REV-${reversement.id.toString().padStart(6, '0')}`],
    ['Type', label],
    ['Date', formatDateShort(reversement.date_reversement)],
  ];
  if (reversement.montant_cdf > 0) rows.push(['Caisse CDF', formatCdf(reversement.montant_cdf)]);
  if (reversement.montant_usd > 0) rows.push(['Caisse USD', formatUsd(reversement.montant_usd)]);
  rows.push(['Période', reversement.periode_debut && reversement.periode_fin ? `${formatDateShort(reversement.periode_debut)} - ${formatDateShort(reversement.periode_fin)}` : '—']);
  receipt(doc, config, 'REÇU DE REVERSEMENT', rows, [180, 83, 9], `recu_reversement_${reversement.id}.pdf`);
}

export interface ReportData {
  title: string;
  periodeLabel: string;
  year: number;
  entrees: EntreeWithCategorie[];
  sorties: Sortie[];
  reversements: Reversement[];
  totalEntreesCdf: number;
  totalEntreesUsd: number;
  totalSortiesCdf: number;
  totalSortiesUsd: number;
  totalReversementsCdf: number;
  totalReversementsUsd: number;
  soldeCdf: number;
  soldeUsd: number;
}

export function generateReport(config: Config, report: ReportData) {
  const doc = new jsPDF();
  officialHeader(doc, report.title);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Période : ${report.periodeLabel}`, 14, 69);
  doc.text(`Exercice : ${report.year}`, 196, 69, { align: 'right' });

  autoTable(doc, {
    startY: 76,
    head: [['Type', 'Nombre', 'Total CDF', 'Total USD']],
    body: [
      ['Entrées', String(report.entrees.length), formatCdf(report.totalEntreesCdf), formatUsd(report.totalEntreesUsd)],
      ['Sorties', String(report.sorties.length), formatCdf(report.totalSortiesCdf), formatUsd(report.totalSortiesUsd)],
      ['Reversements', String(report.reversements.length), formatCdf(report.totalReversementsCdf), formatUsd(report.totalReversementsUsd)],
      ['Solde', '', formatCdf(report.soldeCdf), formatUsd(report.soldeUsd)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52] },
    margin: { left: 14, right: 14, bottom: 22 },
  });

  const detailRows: string[][] = [
    ...report.entrees.map((item) => [formatDateShort(item.date), 'Entrée', item.categorie_nom || item.culte, item.culte, item.devise === 'CDF' ? formatCdf(item.montant_cdf) : formatUsd(item.montant_usd), item.note || '—']),
    ...report.sorties.map((item) => [formatDateShort(item.date), 'Sortie', item.nature, item.beneficiaire || '—', item.devise === 'CDF' ? formatCdf(item.montant_cdf) : formatUsd(item.montant_usd), item.description || '—']),
    ...report.reversements.map((item) => [formatDateShort(item.date_reversement), 'Reversement', item.type, item.periode_debut && item.periode_fin ? `${item.periode_debut} - ${item.periode_fin}` : '—', `${formatCdf(item.montant_cdf)} / ${formatUsd(item.montant_usd)}`, '—']),
  ];

  if (detailRows.length > 0) {
    autoTable(doc, {
      startY: 112,
      head: [['Date', 'Type', 'Nature / Type', 'Bénéficiaire / Période', 'Montant', 'Détails']],
      body: detailRows,
      theme: 'grid',
      headStyles: { fillColor: [22, 101, 52] },
      bodyStyles: { fontSize: 7.5 },
      margin: { left: 14, right: 14, bottom: 22 },
    });
  }

  footer(doc);
  doc.save(`rapport_${report.periodeLabel.replace(/[^a-zA-Z0-9-]+/g, '_')}.pdf`);
}
