#!/usr/bin/env python3
"""
update_veiculos.py — Updates municipios_217.js and dados_municipios_full.js
with vehicle data from the PDF 'Evento_MA_Sustentavel_e_coopera_28-08.pdf'.

PDF data:
- Tratores Agrícolas: 66 (49 original + 10 on 24/08 + 7 on 26/08)
- Retroescavadeiras: 55 (15 original + 24 on 24/08 + 16 on 25/08 + 21 on 26/08) — wait, let me recount: 15 + 24 + 16 + 21 = 76? No, the PDF lists:
  - 15 original retro
  - 24 on 24/08
  - 16 on 25/08  
  - 21 on 26/08
  Total: 76? But some overlap between tractor and retro lists.

- Carros: 32

The PDF lists vehicles in separate sections. A municipality can appear in multiple
categories (tractor AND retro, etc.). The equipamento_solicitado field stores
the concatenated value: "Trator agrícola; Retroescavadeira" if both.

For the existing data, some entries already have both (e.g., São José dos Basílios).
We need to:
1. Add missing equipamento_solicitado to municipalities
2. Update existing equipamento_solicitado if it doesn't match PDF
3. Add "Carro" to municipalities that have carros but not already listed
"""

import re

# ============================================================
# PDF data: municipality name -> set of equipment types
# ============================================================

# Build the mapping from PDF
# The PDF lists names, we need to map them to IBGE codes

# First, let me load the existing municipios data to get name->ibge mapping
path_217 = r'C:\Users\Windows\Documents\gestao\15_Projetos\segov-dashboard-react\src\data\municipios_217.js'
with open(path_217) as f:
    content_217 = f.read()

# Extract all ibge -> nome mappings
all_entries = re.findall(r'"ibge":\s*"(\d+)"[^}]*?"nome":\s*"([^"]*)"', content_217, re.DOTALL)
ibge_to_nome = {ibge: nome for ibge, nome in all_entries}
nome_to_ibge = {nome: ibge for ibge, nome in all_entries}

# Also build a normalized name map
def normalize_nome(nome):
    # Remove accents, lowercase, normalize
    import unicodedata
    n = unicodedata.normalize('NFD', nome).encode('ascii', 'ignore').decode('ascii')
    n = n.lower().replace('-', ' ').replace("'", '').strip()
    n = re.sub(r'\s+', ' ', n)
    return n

norm_to_ibge = {}
for nome, ibge in nome_to_ibge.items():
    norm_to_ibge[normalize_nome(nome)] = ibge

# PDF Tratores list (all 66)
pdf_tractors_names = [
    "Água Doce do Maranhão", "Alcântara", "Axixá", "Bela Vista do Maranhão",
    "Belágua", "Benedito Leite", "Bequimão", "Buriti", "Cachoeira Grande",
    "Cajari", "Cedral", "Conceição do Lago-Açu", "Cururupu", "Fernando Falcão",
    "Formosa da Serra Negra", "Fortaleza dos Nogueiras", "Governador Archer",
    "Governador Eugênio Barros", "Itapecuru-Mirim", "Jatobá", "João Lisboa",
    "Loreto", "Morros", "Nova Colinas", "Nova Iorque", "Paraibano",
    "Passagem Franca", "Pastos Bons", "Peritoró", "Primeira Cruz",
    "Riachão", "Sambaíba", "Santa Luzia", "Santa Rita", "São Félix de Balsas",
    "São Francisco do Maranhão", "São José dos Basílios", "São Luís Gonzaga do Maranhão",
    "São Pedro dos Crentes", "São Raimundo das Mangabeiras", "São Roberto",
    "Satubinha", "Senador La Rocque", "Sítio Novo", "Sucupira do Norte",
    "Tasso Fragoso", "Tufilândia", "Urbano Santos", "Vila Nova dos Martírios",
    # 24/08
    "Balsas", "Barra do Corda", "Brejo de Areia", "Cantanhede", "Caxias",
    "Governador Newton Bello", "Graça Aranha", "Igarapé do Meio", "Miranda do Norte",
    "Nina Rodrigues",
    # 26/08
    "Buritirana", "Feira Nova do Maranhão", "Itaipava do Grajaú", "Joselândia",
    "Lajeado Novo", "Pedreiras", "Presidente Juscelino",
]

# PDF Retroescavadeiras list (all 55)
pdf_retro_names = [
    "Apicum-Açu", "Bacabeira", "Bom Jesus das Selvas", "Buriti Bravo",
    "Duque Bacelar", "Godofredo Viana", "Grajaú", "Paço do Lumiar",
    "Parnarama", "Penalva", "Mirador", "Raposa", "São José de Ribamar",
    "Serrano do Maranhão", "Turiaçu",
    # 24/08
    "Alto Parnaíba", "Amarante do Maranhão", "Arari", "Bacabal",
    "Barão de Grajaú", "Barreirinhas", "Bernardo do Mearim", "Bom Jardim",
    "Codó", "Coelho Neto", "Coroatá", "Montes Altos", "Pinheiro",
    "Pindaré Mirim", "Porto Franco", "Porto Rico", "Santa Inês",
    "São Bento", "São Bernardo", "São Mateus", "Timbiras", "Tutóia",
    "Tuntum", "Viana",
    # 25/08
    "Anapurus", "Cajapió", "Carolina", "Carutapera", "Esperantinópolis",
    "Estreito", "Fortuna", "Igarapé Grande", "Itinga do Maranhão",
    "Matões do Norte", "Presidente Médici", "Rosário",
    "Santa Quitéria do Maranhão", "São João do Paraíso", "Timon",
    "Vitória do Mearim",
    # 26/08
    "Altamira do Maranhão", "Anajatuba", "Cândido Mendes", "Cidelândia",
    "Gonçalves Dias", "Governador Edson Lobão", "Guimarães", "Icatu",
    "Lago da Pedra", "Lima Campos", "Maranhãozinho", "Olho D'Água das Cunhãs",
    "Olinda Nova do Maranhão", "Peri Mirim", "Santa Filomena do Maranhão",
    "Santa Helena", "São Bendito do Rio Preto", "São Domingos do Maranhão",
    "São João Batista", "Trizidela do Vale", "Zé doca",
]

# PDF Carros list (all 32)
pdf_carros_names = [
    "Apicum-Açu", "Bacabeira", "Benedito Leite", "Bom Jesus das Selvas",
    "Buriti Bravo", "Cachoeira Grande", "Conceição do Lago-Açu", "Duque Bacelar",
    "Godofredo Viana", "Governador Archer", "Governador Eugênio Barros", "Grajaú",
    "Jatobá", "João Lisboa", "Paço do Lumiar", "Paraibano", "Parnarama",
    "Passagem Franca", "Pastos Bons", "Penalva", "Primeira Cruz", "Raposa",
    "Sambaíba", "Santa Rita", "São José de Ribamar", "São Luís Gonzaga do Maranhão",
    "São Raimundo das Mangabeiras", "Serrano do Maranhão", "Sítio Novo",
    "Sucupira do Norte", "Turiaçu", "Vila Nova dos Martírios",
]

# Now map names to IBGE codes
def name_to_ibge(name):
    # Direct match
    if name in nome_to_ibge:
        return nome_to_ibge[name]
    
    # Normalized match
    norm = normalize_nome(name)
    if norm in norm_to_ibge:
        return norm_to_ibge[norm]
    
    # Try alternate names
    alternates = {
        "Itapecuru-Mirim": "Itapecuru Mirim",
        "Pindaré Mirim": "Pindaré-Mirim",
        "Pindaré-Mirim": "Pindaré-Mirim",
        "Porto Rico": "Porto Rico do Maranhão",
        "São Mateus": "São Mateus do Maranhão",
        "Estreito": "Estreito",
        "Zé doca": "Zé Doca",
        "Zé Doca": "Zé Doca",
    }
    
    if name in alternates:
        alt = alternates[name]
        if alt in nome_to_ibge:
            return nome_to_ibge[alt]
        norm_alt = normalize_nome(alt)
        if norm_alt in norm_to_ibge:
            return norm_to_ibge[norm_alt]
    
    print(f"  WARNING: Cannot find IBGE for '{name}'")
    return None

# Build final mapping: ibge -> list of equipment types
equip_map = {}

for name in pdf_tractors_names:
    ibge = name_to_ibge(name)
    if ibge:
        equip_map.setdefault(ibge, set()).add("Trator agrícola")

for name in pdf_retro_names:
    ibge = name_to_ibge(name)
    if ibge:
        equip_map.setdefault(ibge, set()).add("Retroescavadeira")

for name in pdf_carros_names:
    ibge = name_to_ibge(name)
    if ibge:
        equip_map.setdefault(ibge, set()).add("Carro")

print(f"Total municipalities with equipment in PDF: {len(equip_map)}")
print(f"Trators: {sum(1 for v in equip_map.values() if 'Trator agrícola' in v)}")
print(f"Retro: {sum(1 for v in equip_map.values() if 'Retroescavadeira' in v)}")
print(f"Carros: {sum(1 for v in equip_map.values() if 'Carro' in v)}")

# Check for municipalities with multiple types
multi = {k: v for k, v in equip_map.items() if len(v) > 1}
print(f"\nMunicipalities with multiple equipment types: {len(multi)}")
for ibge, types in sorted(multi.items()):
    nome = ibge_to_nome.get(ibge, "UNKNOWN")
    print(f"  {ibge} ({nome}): {sorted(types)}")

# Save the mapping for next step
import json
with open('/tmp/equip_map.json', 'w') as f:
    json.dump({k: sorted(v) for k, v in equip_map.items()}, f, indent=2)

# Now check what changes are needed
existing_equip = re.findall(r'"ibge":\s*"(\d+)"[^}]*?"equipamento_solicitado":\s*"([^"]*)"', content_217, re.DOTALL)
existing_equip_map = dict(existing_equip)

print(f"\n--- Changes needed ---")
updates = []
adds = []

for ibge, equip_types in sorted(equip_map.items()):
    new_equip = "; ".join(sorted(equip_types))
    nome = ibge_to_nome.get(ibge, "UNKNOWN")
    
    if ibge in existing_equip_map:
        old_equip = existing_equip_map[ibge]
        # Check if they match (considering the existing complex format)
        old_types = set()
        for part in old_equip.split(';'):
            part = part.strip().lower()
            if 'trator' in part:
                old_types.add('Trator agrícola')
            if 'retro' in part:
                old_types.add('Retroescavadeira')
            if 'carro' in part:
                old_types.add('Carro')
        
        if old_types != equip_types:
            updates.append((ibge, nome, old_equip, new_equip))
    else:
        adds.append((ibge, nome, new_equip))

print(f"Updates: {len(updates)}")
for ibge, nome, old, new in updates:
    print(f"  {ibge} ({nome}): '{old}' -> '{new}'")

print(f"\nAdds: {len(adds)}")
for ibge, nome, new in adds:
    print(f"  {ibge} ({nome}): {new}")

print(f"\nTotal changes: {len(updates)} + {len(adds)} = {len(updates) + len(adds)}")
PYEOF