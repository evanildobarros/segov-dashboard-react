-- Schema para dados políticos do SEGOV-MA

CREATE TABLE IF NOT EXISTS dados_municipios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conteudo_base64 TEXT NOT NULL,
  total_municipios INTEGER,
  total_obras INTEGER,
  actor TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dados_municipios_created ON dados_municipios(created_at);
CREATE INDEX IF NOT EXISTS idx_dados_municipios_actor ON dados_municipios(actor);
