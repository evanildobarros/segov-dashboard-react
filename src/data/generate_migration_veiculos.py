import json
import os

# Load dados_municipios.json
with open('dados_municipios.json', encoding='utf-8') as f:
    data = json.load(f)

sql_lines = []

# 1. Drop existing tables
sql_lines.append("DROP TABLE IF EXISTS obras;")
sql_lines.append("DROP TABLE IF EXISTS obras_resumo;")

# 2. Create veiculos table
sql_lines.append("""CREATE TABLE veiculos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  municipio_ibge INTEGER NOT NULL,
  equipamento_solicitado TEXT DEFAULT '',
  equipamento_categoria TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);""")

# 3. Create clean municipios table (without obra and equipamento columns)
sql_lines.append("""CREATE TABLE municipios_new (
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
);""")

# 4. Copy reference data from old municipios
sql_lines.append("INSERT INTO municipios_new (id, ibge, nome, grupo, prioritario, cor, prefeito, alinhamento, total_liderancas, solicitante, created_at, updated_at, partido, mesorregiao) SELECT id, ibge, nome, grupo, prioritario, cor, prefeito, alinhamento, total_liderancas, solicitante, created_at, updated_at, partido, mesorregiao FROM municipios;")

# 5. Copy veiculos data from old municipios
sql_lines.append("INSERT INTO veiculos (municipio_ibge, equipamento_solicitado, equipamento_categoria, created_at, updated_at) SELECT CAST(ibge AS INTEGER), equipamento_solicitado, equipamento_categoria, created_at, updated_at FROM municipios;")

# 6. Drop old municipios and rename new
sql_lines.append("DROP TABLE municipios;")
sql_lines.append("ALTER TABLE municipios_new RENAME TO municipios;")

# 7. Create obras table (with obra columns, no FK)
sql_lines.append("""CREATE TABLE obras (
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
);""")

# 8. Insert all 217 obra summary records from dados_municipios.json
for m in data['municipios']:
    ibge_int = int(m['ibge'])
    nome = m['nome'].replace("'", "''")
    eixos = json.dumps(m.get('eixos', []), ensure_ascii=False).replace("'", "''")
    asfalto_raw = m.get('asfalto', {})
    if asfalto_raw and isinstance(asfalto_raw, dict) and asfalto_raw:
        asfalto = json.dumps(asfalto_raw, ensure_ascii=False).replace("'", "''")
    else:
        asfalto = '{}'
    investimento = (m.get('investimento_planner', '') or '').replace("'", "''")
    total_obras = m.get('total_obras', 0) or 0
    em_andamento = m.get('obras_em_andamento', 0) or 0
    entregues = m.get('obras_entregues', 0) or 0
    paradas = m.get('obras_paradas', 0) or 0

    sql = f"INSERT INTO obras (municipio_ibge, nome_obra, categoria, status, valor, eixos, asfalto, investimento_planner, total_obras, obras_em_andamento, obras_entregues, obras_paradas) VALUES ({ibge_int}, '{nome}', 'Geral', 'planejado', 0, '{eixos}', '{asfalto}', '{investimento}', {total_obras}, {em_andamento}, {entregues}, {paradas});"
    sql_lines.append(sql)

# Write to file at project root
output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'migration_complete.sql')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(sql_lines))

print(f"Generated {len(sql_lines)} SQL statements")
print(f"Tables created: 3 (veiculos, municipios_new→municipios, obras)")
print(f"Veiculos records: 217 (from municipios.equipamento)")
print(f"Municipios inserted: {len(data['municipios'])}")
print(f"Obras records inserted: {len(data['municipios'])}")
print(f"Output file: {output_path}")
