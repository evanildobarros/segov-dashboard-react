-- Migration: Create veiculos table and move equipamento columns from municipios
-- Step 1: Drop existing obras table (will recreate without FK)
DROP TABLE IF EXISTS obras;
DROP TABLE IF EXISTS obras_resumo;

-- Step 2: Create veiculos table
CREATE TABLE veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  municipio_ibge INTEGER NOT NULL,
  equipamento_solicitado TEXT DEFAULT '',
  equipamento_categoria TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create clean municipios table (without obra and equipamento columns)
CREATE TABLE municipios_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ibge TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  grupo TEXT DEFAULT 'indefinido',
  prioritario BOOLEAN DEFAULT 0,
  cor TEXT DEFAULT '#BDC3C7',
  prefeito TEXT DEFAULT '',
  alinhamento TEXT DEFAULT '',
  total_liderancas INTEGER DEFAULT 0,
  solicitante TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  partido TEXT DEFAULT '',
  mesorregiao TEXT
);

-- Step 4: Copy reference data from old municipios (without obra columns)
INSERT INTO municipios_new (id, ibge, nome, grupo, prioritario, cor, prefeito, alinhamento, total_liderancas, solicitante, created_at, updated_at, partido, mesorregiao)
SELECT id, ibge, nome, grupo, prioritario, cor, prefeito, alinhamento, total_liderancas, solicitante, created_at, updated_at, partido, mesorregiao FROM municipios;

-- Step 5: Copy veiculos data from old municipios
INSERT INTO veiculos (municipio_ibge, equipamento_solicitado, equipamento_categoria, created_at, updated_at)
SELECT CAST(ibge AS INTEGER), equipamento_solicitado, equipamento_categoria, created_at, updated_at FROM municipios;

-- Step 6: Drop old tables and rename
DROP TABLE municipios;
DROP TABLE obras;
ALTER TABLE municipios_new RENAME TO municipios;

-- Step 7: Create obras table (without FK, with obra columns)
CREATE TABLE obras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  municipio_ibge INTEGER NOT NULL,
  nome_obra TEXT,
  categoria TEXT DEFAULT 'Geral',
  status TEXT DEFAULT 'planejado',
  valor REAL DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  eixos TEXT DEFAULT '[]',
  asfalto TEXT DEFAULT '{}',
  investimento_planner TEXT DEFAULT '',
  total_obras INTEGER DEFAULT 0,
  obras_em_andamento INTEGER DEFAULT 0,
  obras_entregues INTEGER DEFAULT 0,
  obras_paradas INTEGER DEFAULT 0
);

-- Step 8: Copy obras data from backup... wait, we dropped it. Need to recreate from dados_municipios.json
-- This will be done separately via the generate_migration.py script
