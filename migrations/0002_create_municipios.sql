-- Schema para dados municipais normalizados (tabela relacional)

CREATE TABLE IF NOT EXISTS municipios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ibge TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  grupo TEXT DEFAULT 'indefinido',
  prioritario BOOLEAN DEFAULT 0,
  cor TEXT DEFAULT '#BDC3C7',
  prefeito TEXT DEFAULT '',
  alinhamento TEXT DEFAULT '',
  total_obras INTEGER DEFAULT 0,
  obras_em_andamento INTEGER DEFAULT 0,
  obras_entregues INTEGER DEFAULT 0,
  total_liderancas INTEGER DEFAULT 0,
  investimento_planner TEXT DEFAULT '',
  equipamento_solicitado TEXT DEFAULT '',
  equipamento_categoria TEXT DEFAULT '',
  solicitante TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_municipios_ibge ON municipios(ibge);
CREATE INDEX IF NOT EXISTS idx_municipios_grupo ON municipios(grupo);
CREATE INDEX IF NOT EXISTS idx_municipios_prioritario ON municipios(prioritario);
CREATE INDEX IF NOT EXISTS idx_municipios_nome ON municipios(nome);
CREATE INDEX IF NOT EXISTS idx_municipios_equipamento ON municipios(equipamento_solicitado);
