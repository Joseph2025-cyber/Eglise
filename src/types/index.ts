export interface Config {
  id: number;
  nom_communaute: string;
  paroisse: string;
  devise: 'CDF' | 'USD';
  mdp_acces: string;
  mdp_sortie: string;
  exercice_en_cours: number;
}

export interface Categorie {
  id: number;
  nom: string;
  ordre: number;
}

export interface Entree {
  id: number;
  date: string;
  culte: string;
  categorie_id: number;
  montant: number;
  note: string | null;
  created_at: string;
}

export interface EntreeWithCategorie extends Entree {
  categorie_nom?: string;
}

export interface Sortie {
  id: number;
  date: string;
  nature: string;
  montant: number;
  description: string | null;
  nom_operateur: string;
  telephone_operateur: string;
  created_at: string;
}

export interface Reversement {
  id: number;
  type: 'communaute_centrale' | 'apotre';
  montant: number;
  date_reversement: string;
  periode_debut: string | null;
  periode_fin: string | null;
  created_at: string;
}

export interface Exercice {
  id: number;
  annee: number;
  date_archive: string;
  total_entrees: number;
  total_sorties: number;
  total_reversements: number;
  donnees: Record<string, unknown> | null;
}

export const CULTE_OPTIONS = [
  'Culte de Dimanche',
  'Mercredi Solution',
  'Soirée de Gloire',
  'Séminaire',
] as const;

export const CATEGORIES_REVERSEMENT = [
  'Dîmes',
  'Offrandes Ordinaires',
  'Actions de Grâce',
  'Évangélisation',
] as const;

export type DashboardTotals = {
  categories: { nom: string; montant: number }[];
  totalGlobal: number;
  totalCommunauteCentrale: number;
  totalApotre: number;
  entreesMois: number;
  entreesMoisPrecedent: number;
  sortiesMois: number;
  soldeNet: number;
};
