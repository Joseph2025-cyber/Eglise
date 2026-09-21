export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  nom_communaute TEXT NOT NULL DEFAULT 'ÉGLISE GLOIRE DE DIEU',
  paroisse TEXT NOT NULL DEFAULT 'PAROISSE DE KYESHERO',
  -- Colonne héritée: aucune conversion CDF/USD n'est effectuée par l'application.
  taux_usd_cdf REAL NOT NULL DEFAULT 0,
  mdp_acces TEXT NOT NULL DEFAULT 'admin123',
  mdp_sortie TEXT NOT NULL DEFAULT 'sortie123',
  exercice_en_cours INTEGER NOT NULL DEFAULT 2026,
  CHECK (id = 1)
);

INSERT INTO config (id) VALUES (1)
ON CONFLICT(id) DO NOTHING;

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nom TEXT NOT NULL UNIQUE,
  ordre INTEGER NOT NULL DEFAULT 0
);

INSERT INTO categories (nom, ordre) VALUES
  ('Dîmes', 1),
  ('Offrandes Ordinaires', 2),
  ('Actions de Grâce', 3),
  ('Évangélisation', 4),
  ('Offrandes Extraordinaires', 5),
  ('Dons', 6)
ON CONFLICT(nom) DO NOTHING;

CREATE TABLE IF NOT EXISTS entrees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  culte TEXT NOT NULL,
  categorie_id INTEGER NOT NULL REFERENCES categories(id),
  beneficiaire TEXT,
  numero_beneficiaire TEXT,
  devise TEXT NOT NULL DEFAULT 'CDF' CHECK (devise IN ('CDF', 'USD')),
  montant INTEGER NOT NULL CHECK (montant >= 0),
  montant_cdf INTEGER NOT NULL DEFAULT 0,
  montant_usd INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_entrees_date ON entrees(date);
CREATE INDEX IF NOT EXISTS idx_entrees_categorie ON entrees(categorie_id);

CREATE TABLE IF NOT EXISTS sorties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  nature TEXT NOT NULL,
  devise TEXT NOT NULL DEFAULT 'CDF' CHECK (devise IN ('CDF', 'USD')),
  montant INTEGER NOT NULL CHECK (montant >= 0),
  montant_cdf INTEGER NOT NULL DEFAULT 0,
  montant_usd INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  nom_operateur TEXT NOT NULL,
  telephone_operateur TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sorties_date ON sorties(date);

CREATE TABLE IF NOT EXISTS reversements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('communaute_centrale', 'apotre')),
  montant_cdf INTEGER NOT NULL DEFAULT 0,
  montant_usd INTEGER NOT NULL DEFAULT 0,
  date_reversement TEXT NOT NULL,
  periode_debut TEXT,
  periode_fin TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reversements_date ON reversements(date_reversement);
CREATE INDEX IF NOT EXISTS idx_reversements_type ON reversements(type);

CREATE TABLE IF NOT EXISTS exercices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  annee INTEGER NOT NULL UNIQUE,
  date_archive TEXT DEFAULT (datetime('now')),
  total_entrees INTEGER NOT NULL DEFAULT 0,
  total_sorties INTEGER NOT NULL DEFAULT 0,
  total_reversements INTEGER NOT NULL DEFAULT 0,
  donnees TEXT
);
`;
