import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatFC, formatDateShort, formatDate, MONTH_NAMES } from '@/utils/format';
import type { EntreeWithCategorie, Sortie, Reversement, Config } from '@/types';

function header(doc: jsPDF, config: Config, subtitle: string) {
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

function footer(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Édité le ${formatDate(new Date())} - Page ${i}/${pageCount}`,
      105,
      290,
      { align: 'center' },
    );
  }
}

export function generateRecuEntree(
  config: Config,
  entree: EntreeWithCategorie,
  categorieNom: string,
) {
  const doc = new jsPDF();
  header(doc, config, 'REÇU D\'ENTRÉE');

  let y = 50;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const lines = [
    { label: 'N° Reçu', value: `ENT-${entree.id.toString().padStart(6, '0')}` },
    { label: 'Date', value: formatDateShort(entree.date) },
    { label: 'Culte / Service', value: entree.culte },
    { label: 'Catégorie', value: categorieNom },
    { label: 'Montant', value: formatFC(entree.montant) },
    { label: 'Note', value: entree.note || '—' },
  ];

  autoTable(doc, {
    startY: y,
    head: [['Champ', 'Valeur']],
    body: lines.map((l) => [l.label, l.value]),
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52], fontSize: 11 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`recu_entree_${entree.id}.pdf`);
}

export function generateRecuSortie(config: Config, sortie: Sortie) {
  const doc = new jsPDF();
  header(doc, config, 'REÇU DE SORTIE');

  const y = 50;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const lines = [
    { label: 'N° Reçu', value: `SORT-${sortie.id.toString().padStart(6, '0')}` },
    { label: 'Date', value: formatDateShort(sortie.date) },
    { label: 'Nature du décaissement', value: sortie.nature },
    { label: 'Montant', value: formatFC(sortie.montant) },
    { label: 'Description', value: sortie.description || '—' },
    { label: 'Opérateur', value: sortie.nom_operateur },
    { label: 'Téléphone', value: sortie.telephone_operateur },
  ];

  autoTable(doc, {
    startY: y,
    head: [['Champ', 'Valeur']],
    body: lines.map((l) => [l.label, l.value]),
    theme: 'striped',
    headStyles: { fillColor: [185, 28, 28], fontSize: 11 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`recu_sortie_${sortie.id}.pdf`);
}

export function generateRecuReversement(
  config: Config,
  reversement: Reversement,
  label: string,
) {
  const doc = new jsPDF();
  header(doc, config, 'REÇU DE REVERSEMENT');

  const y = 50;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const lines = [
    { label: 'N° Reçu', value: `REV-${reversement.id.toString().padStart(6, '0')}` },
    { label: 'Type', value: label },
    { label: 'Date', value: formatDateShort(reversement.date_reversement) },
    { label: 'Montant', value: formatFC(reversement.montant) },
    {
      label: 'Période',
      value:
        reversement.periode_debut && reversement.periode_fin
          ? `${formatDateShort(reversement.periode_debut)} - ${formatDateShort(reversement.periode_fin)}`
          : '—',
    },
  ];

  autoTable(doc, {
    startY: y,
    head: [['Champ', 'Valeur']],
    body: lines.map((l) => [l.label, l.value]),
    theme: 'striped',
    headStyles: { fillColor: [180, 83, 9], fontSize: 11 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`recu_reversement_${reversement.id}.pdf`);
}

interface ReportData {
  title: string;
  periodeLabel: string;
  entrees: EntreeWithCategorie[];
  sorties: Sortie[];
  reversements: Reversement[];
  totalEntrees: number;
  totalSorties: number;
  totalReversements: number;
  solde: number;
}

export function generateReport(config: Config, data: ReportData) {
  const doc = new jsPDF();
  header(doc, config, data.title);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Période: ${data.periodeLabel}`, 105, 44, { align: 'center' });

  let y = 54;

  // Entrées par catégorie
  const parCategorie = new Map<string, number>();
  for (const e of data.entrees) {
    const nom = e.categorie_nom || '—';
    parCategorie.set(nom, (parCategorie.get(nom) || 0) + e.montant);
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ENTRÉES', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Culte', 'Catégorie', 'Montant', 'Note']],
    body: data.entrees.map((e) => [
      formatDateShort(e.date),
      e.culte,
      e.categorie_nom || '—',
      formatFC(e.montant),
      e.note || '—',
    ]),
    foot: [['', '', 'Total Entrées', formatFC(data.totalEntrees), '']],
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    footStyles: { fillColor: [22, 101, 52], fontSize: 9, textColor: [255, 255, 255] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Résumé par catégorie
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Résumé par catégorie', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Catégorie', 'Montant']],
    body: Array.from(parCategorie.entries()).map(([nom, montant]) => [nom, formatFC(montant)]),
    theme: 'striped',
    headStyles: { fillColor: [22, 101, 52], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Sorties
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SORTIES', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Nature', 'Montant', 'Description', 'Opérateur']],
    body: data.sorties.map((s) => [
      formatDateShort(s.date),
      s.nature,
      formatFC(s.montant),
      s.description || '—',
      `${s.nom_operateur} (${s.telephone_operateur})`,
    ]),
    foot: [['', 'Total Sorties', formatFC(data.totalSorties), '', '']],
    theme: 'striped',
    headStyles: { fillColor: [185, 28, 28], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    footStyles: { fillColor: [185, 28, 28], fontSize: 9, textColor: [255, 255, 255] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Reversements
  if (data.reversements.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('REVERSEMENTS', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Montant', 'Période']],
      body: data.reversements.map((r) => [
        formatDateShort(r.date_reversement),
        r.type === 'communaute_centrale' ? 'Communauté Centrale (20%)' : 'Apôtre (10%)',
        formatFC(r.montant),
        r.periode_debut && r.periode_fin
          ? `${formatDateShort(r.periode_debut)} - ${formatDateShort(r.periode_fin)}`
          : '—',
      ]),
      foot: [['', 'Total Reversements', formatFC(data.totalReversements), '']],
      theme: 'striped',
      headStyles: { fillColor: [180, 83, 9], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      footStyles: { fillColor: [180, 83, 9], fontSize: 9, textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Synthèse
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SYNTHÈSE', 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Montant']],
    body: [
      ['Total Entrées', formatFC(data.totalEntrees)],
      ['Total Sorties', formatFC(data.totalSorties)],
      ['Total Reversements', formatFC(data.totalReversements)],
      ['Solde Net en Caisse', formatFC(data.solde)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 95], fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`rapport_${data.title.replace(/\s/g, '_').toLowerCase()}.pdf`);
}

export { MONTH_NAMES };
