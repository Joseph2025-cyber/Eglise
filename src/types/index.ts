export type Devise = 'CDF' | 'USD';

export interface Config {
  id: number;
  nom_communaute: string;
  paroisse: string;
  taux_usd_cdf: number;
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
  beneficiaire: string | null;
  numero_beneficiaire: string | null;
  devise: Devise;
  montant: number;
  montant_cdf: number;
  montant_usd: number;
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
  devise: Devise;
  montant: number;
  montant_cdf: number;
  montant_usd: number;
  description: string | null;
  nom_operateur: string;
  telephone_operateur: string;
  created_at: string;
}

export interface Reversement {
  id: number;
  type: 'communaute_centrale' | 'apotre';
  montant_cdf: number;
  montant_usd: number;
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
  donnees: string | null;
}

export const CULTE_OPTIONS = [
  'Culte de Dimanche',
  'Mercredi Solution',
  'Soirée de Gloire',
  'Séminaire',
  'Autres cultes',
] as const;

export const CATEGORIES_REVERSEMENT = [
  'Dîmes',
  'Offrandes Ordinaires',
  'Actions de Grâce',
  'Évangélisation',
] as const;

export const SPECIAL_CATEGORY_NAMES = ['Offrandes Extraordinaires', 'Dons'] as const;

export type DashboardTotals = {
  categories: { nom: string; montant_cdf: number; montant_usd: number }[];
  totalGlobalCdf: number;
  totalGlobalUsd: number;
  totalCommunauteCentraleCdf: number;
  totalCommunauteCentraleUsd: number;
  totalApotreCdf: number;
  totalApotreUsd: number;
  entreesMoisCdf: number;
  entreesMoisUsd: number;
  entreesMoisPrecedentCdf: number;
  entreesMoisPrecedentUsd: number;
  sortiesMoisCdf: number;
  sortiesMoisUsd: number;
  soldeNetCdf: number;
  soldeNetUsd: number;
};
