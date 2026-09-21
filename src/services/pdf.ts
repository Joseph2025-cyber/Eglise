import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCdf, formatUsd, formatDate, formatDateShort } from '@/utils/format';
import type { Config, EntreeWithCategorie, Reversement, Sortie } from '@/types';

function header(doc: jsPDF, config: Config, subtitle: string): void {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(config.nom_communaute, 105, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(config.paroisse, 105, 25, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(subtitle, 105, 34, { align: 'center' });
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);
}

function footer(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Édité le ${formatDate(new Date())} - Page ${page}/${pageCount}`, 105, 290, { align: 'center' });
    doc.text('Approuvé par le pasteur Kameya Kaboyi Josué', 105, 296, { align: 'center' });
  }
}

function receipt(
  doc: jsPDF,
  config: Config,
  title: string,
  rows: [string, string][],
  color: [number, number, number],
  filename: string,
): void {
  header(doc, config, title);
  autoTable(doc, {
    startY: 50,
    head: [['Champ', 'Valeur']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: color, fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  footer(doc);
  doc.save(filename);
}

export function generateRecuEntree(config: Config, entree: EntreeWithCategorie, categorieNom: string): void {
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

export function generateRecuSortie(config: Config, sortie: Sortie): void {
  const doc = new jsPDF();
  receipt(doc, config, 'REÇU DE SORTIE', [
    ['N° Reçu', `SORT-${sortie.id.toString().padStart(6, '0')}`],
    ['Date', formatDateShort(sortie.date)],
    ['Nature du décaissement', sortie.nature],
    ['Caisse', sortie.devise],
    ['Montant', sortie.devise === 'CDF' ? formatCdf(sortie.montant_cdf) : formatUsd(sortie.montant_usd)],
    ['Description', sortie.description || '—'],
    ['Opérateur', sortie.nom_operateur],
    ['Téléphone', sortie.telephone_operateur],
  ], [185, 28, 28], `recu_sortie_${sortie.id}.pdf`);
}

export function generateRecuReversement(config: Config, reversement: Reversement, label: string): void {
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

interface ReportData {
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
  soldeCdf?: number;
  soldeUsd?: number;
}

export function generateReport(config: Config, data: ReportData): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  header(doc, config, data.title);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Période: ${data.periodeLabel}`, 148, 44, { align: 'center' });
  doc.text(`Année: ${data.year}`, 148, 49, { align: 'center' });

  let y = 56;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRÉES', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Culte', 'Catégorie', 'Bénéficiaire', 'N° Bénéficiaire', 'Caisse', 'Montant', 'Note']],
    body: data.entrees.map((entry) => [
      formatDateShort(entry.date), entry.culte, entry.categorie_nom || '—', entry.beneficiaire || '—',
      entry.numero_beneficiaire || '—', entry.devise,
      entry.devise === 'CDF' ? formatCdf(entry.montant_cdf) : formatUsd(entry.montant_usd), entry.note || '—',
    ]),
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  doc.setFontSize(10);
  doc.text('RÉSUMÉ PAR CATÉGORIE', 14, y);
  y += 4;
  const categoryTotals = new Map<string, { cdf: number; usd: number }>();
  for (const entry of data.entrees) {
    const current = categoryTotals.get(entry.categorie_nom || '—') || { cdf: 0, usd: 0 };
    categoryTotals.set(entry.categorie_nom || '—', { cdf: current.cdf + entry.montant_cdf, usd: current.usd + entry.montant_usd });
  }
  autoTable(doc, {
    startY: y,
    head: [['Catégorie', 'Caisse CDF', 'Caisse USD']],
    body: Array.from(categoryTotals.entries()).map(([name, totals]) => [name, formatCdf(totals.cdf), formatUsd(totals.usd)]),
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  doc.setFontSize(11);
  doc.text('SORTIES', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Nature', 'Caisse', 'Montant', 'Description', 'Opérateur']],
    body: data.sorties.map((sortie) => [
      formatDateShort(sortie.date), sortie.nature, sortie.devise,
      sortie.devise === 'CDF' ? formatCdf(sortie.montant_cdf) : formatUsd(sortie.montant_usd),
      sortie.description || '—', `${sortie.nom_operateur} (${sortie.telephone_operateur})`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: [185, 28, 28], fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (data.reversements.length > 0) {
    doc.setFontSize(11);
    doc.text('REVERSEMENTS', 14, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Caisse CDF', 'Caisse USD', 'Période']],
      body: data.reversements.map((reversement) => [
        formatDateShort(reversement.date_reversement),
        reversement.type === 'communaute_centrale' ? 'Communauté Centrale (20%)' : 'Apôtre (10%)',
        formatCdf(reversement.montant_cdf), formatUsd(reversement.montant_usd),
        reversement.periode_debut && reversement.periode_fin ? `${formatDateShort(reversement.periode_debut)} - ${formatDateShort(reversement.periode_fin)}` : '—',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [180, 83, 9], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  doc.setFontSize(11);
  doc.text('SYNTHÈSE', 14, y);
  y += 4;
  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Caisse CDF', 'Caisse USD']],
    body: [
      ['Total Entrées', formatCdf(data.totalEntreesCdf), formatUsd(data.totalEntreesUsd)],
      ['Total Sorties', formatCdf(data.totalSortiesCdf), formatUsd(data.totalSortiesUsd)],
      ['Total Reversements', formatCdf(data.totalReversementsCdf), formatUsd(data.totalReversementsUsd)],
      ['Solde Net en Caisse', formatCdf(data.soldeCdf ?? data.totalEntreesCdf - data.totalSortiesCdf - data.totalReversementsCdf), formatUsd(data.soldeUsd ?? data.totalEntreesUsd - data.totalSortiesUsd - data.totalReversementsUsd)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`rapport_${data.title.replace(/\s/g, '_').toLowerCase()}.pdf`);
}
