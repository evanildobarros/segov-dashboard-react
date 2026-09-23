#!/usr/bin/env python3
"""
apply_veiculos_updates.py — Aplica as atualizações de veículos nos arquivos:
  1. src/data/municipios_217.js
  2. src/data/dados_municipios_full.js
  3. src/data/dados_municipios.json

Baseado nos dados do PDF 'Evento_MA_Sustentavel_e_coopera_28-08.pdf'.
"""

import re
import json
import unicodedata

# ============================================================
# Map: IBGE -> equipamento_solicitado final
# Based on PDF data: 66 tractores, 55 retroescavadeiras, 32 carros
# Some municipalities have multiple types, joined with "; "
# ============================================================

FINAL_EQUIP = {
    # Tractores only
    "2100204": "Trator agrícola",  # Alcântara
    "2101400": "Trator agrícola",  # Balsas
    "2101608": "Trator agrícola",  # Barra do Corda
    "2101731": "Trator agrícola",  # Belágua
    "2101772": "Trator agrícola",  # Bela Vista do Maranhão
    "2101905": "Trator agrícola",  # Bequimão
    "2102200": "Trator agrícola",  # Buriti
    "2102705": "Trator agrícola",  # Cantanhede
    "2103109": "Trator agrícola",  # Cedral
    "2103703": "Trator agrícola",  # Cururupu
    "2104081": "Trator agrícola",  # Fernando Falcão
    "2104651": "Trator agrícola",  # Governador Newton Bello
    "2104701": "Trator agrícola",  # Graça Aranha
    "2105401": "Trator agrícola",  # Itapecuru Mirim
    "2105609": "Trator agrícola",  # Joselândia
    "2105989": "Trator agrícola",  # Lajeado Novo
    "2106102": "Trator agrícola",  # Loreto
    "2107100": "Trator agrícola",  # Morros
    "2107258": "Trator agrícola",  # Nova Colinas
    "2108207": "Trator agrícola",  # Pedreiras
    "2109205": "Trator agrícola",  # Presidente Juscelino
    "2109502": "Trator agrícola",  # Riachão
    "2110005": "Trator agrícola",  # Santa Luzia
    "2111573": "Trator agrícola",  # São Pedro dos Crentes
    "2111672": "Trator agrícola",  # São Roberto
    "2111722": "Trator agrícola",  # Satubinha
    "2112001": "Trator agrícola",  # Tasso Fragoso
    "2112274": "Trator agrícola",  # Tufilândia

    # Retroescavadeira only
    "2100402": "Retroescavadeira",  # Altamira do Maranhão
    "2100501": "Retroescavadeira",  # Alto Parnaíba
    "2100600": "Retroescavadeira",  # Amarante do Maranhão
    "2100709": "Retroescavadeira",  # Anajatuba
    "2101004": "Retroescavadeira",  # Arari
    "2101202": "Retroescavadeira",  # Bacabal
    "2101509": "Retroescavadeira",  # Barão de Grajaú
    "2101707": "Retroescavadeira",  # Barreirinhas
    "2101939": "Retroescavadeira",  # Bernardo do Mearim
    "2102002": "Retroescavadeira",  # Bom Jardim
    "2102606": "Retroescavadeira",  # Cândido Mendes
    "2102804": "Retroescavadeira",  # Carolina
    "2103406": "Retroescavadeira",  # Coelho Neto
    "2103604": "Retroescavadeira",  # Coroatá
    "2104057": "Retroescavadeira",  # Estreito
    "2104206": "Retroescavadeira",  # Fortuna
    "2105104": "Retroescavadeira",  # Icatu
    "2105807": "Retroescavadeira",  # Lago da Pedra (Lago do Junco in 217)
    "2106003": "Retroescavadeira",  # Lima Campos
    "2106607": "Retroescavadeira",  # Maranhãozinho
    "2106631": "Retroescavadeira",  # Matões do Norte
    "2106706": "Retroescavadeira",  # Mirador
    "2107001": "Retroescavadeira",  # Montes Altos
    "2107456": "Retroescavadeira",  # Olinda Nova do Maranhão
    "2108405": "Retroescavadeira",  # Peri Mirim
    "2108504": "Retroescavadeira",  # Pindaré-Mirim
    "2109007": "Retroescavadeira",  # Porto Franco
    "2109056": "Retroescavadeira",  # Porto Rico do Maranhão
    "2109239": "Retroescavadeira",  # Presidente Médici
    "2109601": "Retroescavadeira",  # Rosário
    "2109809": "Retroescavadeira",  # Santa Helena
    "2109908": "Retroescavadeira",  # Santa Inês
    "2110104": "Retroescavadeira",  # Santa Quitéria do Maranhão
    "2110708": "Retroescavadeira",  # São Domingos do Maranhão
    "2111052": "Retroescavadeira",  # São João do Paraíso
    "2111508": "Retroescavadeira",  # São Mateus do Maranhão
    "2112209": "Retroescavadeira",  # Timon
    "2112803": "Retroescavadeira",  # Viana
    "2112902": "Retroescavadeira",  # Vitória do Mearim
    "2114007": "Retroescavadeira",  # Zé Doca

    # Carro + Trator (municipalities in both lists)
    "2101806": "Carro; Trator agrícola",  # Benedito Leite
    "2102374": "Carro; Trator agrícola",  # Cachoeira Grande
    "2103554": "Carro; Trator agrícola",  # Conceição do Lago-Açu
    "2104602": "Carro; Trator agrícola",  # Governador Eugênio Barros
    "2105450": "Carro; Trator agrícola",  # Jatobá
    "2105500": "Carro; Trator agrícola",  # João Lisboa (IBGE confirmed: 2105500)
    "2107704": "Carro; Trator agrícola",  # Paraibano
    "2107902": "Carro; Trator agrícola",  # Passagem Franca
    "2108009": "Carro; Trator agrícola",  # Pastos Bons
    "2109403": "Carro; Trator agrícola",  # Primeira Cruz
    "2109700": "Carro; Trator agrícola",  # Sambaíba
    "2110203": "Carro; Trator agrícola",  # Santa Rita
    "2111409": "Carro; Trator agrícola",  # São Luís Gonzaga do Maranhão
    "2111607": "Carro; Trator agrícola",  # São Raimundo das Mangabeiras
    "2111805": "Carro; Trator agrícola",  # Sítio Novo
    "2111904": "Carro; Trator agrícola",  # Sucupira do Norte
    "2112852": "Carro; Trator agrícola",  # Vila Nova dos Martírios

    # Carro + Retroescavadeira
    "2100832": "Carro; Retroescavadeira",  # Apicum-Açu
    "2101251": "Carro; Retroescavadeira",  # Bacabeira
    "2102036": "Carro; Retroescavadeira",  # Bom Jesus das Selvas
    "2102309": "Carro; Retroescavadeira",  # Buriti Bravo
    "2103901": "Carro; Retroescavadeira",  # Duque Bacelar
    "2104800": "Carro; Retroescavadeira",  # Grajaú
    "2104909": "Carro; Retroescavadeira",  # Godofredo Viana
    "2107506": "Carro; Retroescavadeira",  # Paço do Lumiar
    "2107803": "Carro; Retroescavadeira",  # Parnarama
    "2108306": "Carro; Retroescavadeira",  # Penalva
    "2109452": "Carro; Retroescavadeira",  # Raposa
    "2111201": "Carro; Retroescavadeira",  # São José de Ribamar
    "2111789": "Carro; Retroescavadeira",  # Serrano do Maranhão
    "2112407": "Carro; Retroescavadeira",  # Turiaçu

    # Carro + Trator (already existed, only need to add Carro)
    "2104503": "Carro; Trator agrícola",  # Governador Archer
    "2105153": "Carro; Trator agrícola",  # Igarapé do Meio (also has retro from PDF)

    # Updates for municipalities that had wrong equipment
    "2101103": "Trator agrícola",  # Axixá (was Retroescavadeira, should be Trator)
    "2102150": "Trator agrícola",  # Brejo de Areia (was Retro, should be Trator)
    "2105203": "Retroescavadeira",  # Igarapé Grande (was Trator, should be Retro)
    "2105351": "Trator agrícola",  # Itaipava do Grajaú (was "Trator de pneus", should be "Trator agrícola")

    # São José dos Basílios - keep the complex equipment (it had both already)
    "2111250": "Trator agrícola equipado com arado, carreta agrícola e roçadeira; Retroescavadeira",
}

# ============================================================
# Now apply the updates to municipios_217.js
# ============================================================

def update_municipios_217():
    path = r'C:\Users\Windows\Documents\gestao\15_Projetos\segov-dashboard-react\src\data\municipios_217.js'
    with open(path) as f:
        content = f.read()

    original = content
    applied = 0

    for ibge, equip in FINAL_EQUIP.items():
        # Find the entry for this IBGE and update or add equipamento_solicitado
        # Pattern: "ibge": "IBGE" ... "equipamento_solicitado": "..."  (or end of entry)

        # Try to find existing equipamento_solicitado in this entry
        # We need to match the entry boundaries
        entry_pattern = r'(\{\s*"ibge":\s*"' + ibge + r'"[^}]*?)(\}\s*,?)'

        match = re.search(entry_pattern, content, re.DOTALL)
        if match:
            entry_body = match.group(1)
            entry_end = match.group(2)

            # Check if already has equipamento_solicitado
            equip_pattern = r'"equipamento_solicitado":\s*"[^"]*"'
            if re.search(equip_pattern, entry_body):
                # Replace existing
                new_body = re.sub(equip_pattern, f'"equipamento_solicitado": "{equip}"', entry_body)
                content = content.replace(match.group(0), new_body + entry_end)
            else:
                # Add before closing brace
                new_body = entry_body.rstrip() + f',\n    "equipamento_solicitado": "{equip}"'
                content = content.replace(match.group(0), new_body + entry_end)
            applied += 1
        else:
            print(f"  WARNING: IBGE {ibge} not found in municipios_217.js")

    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {applied} entries in municipios_217.js")
    else:
        print("No changes needed for municipios_217.js")

    return applied

# ============================================================
# Now apply the updates to dados_municipios_full.js (same structure)
# ============================================================

def update_dados_municipios_full():
    path = r'C:\Users\Windows\Documents\gestao\15_Projetos\segov-dashboard-react\src\data\dados_municipios_full.js'
    with open(path) as f:
        content = f.read()

    original = content
    applied = 0

    for ibge, equip in FINAL_EQUIP.items():
        entry_pattern = r'(\{\s*"ibge":\s*"' + ibge + r'"[^}]*?)(\}\s*,?)'

        match = re.search(entry_pattern, content, re.DOTALL)
        if match:
            entry_body = match.group(1)
            entry_end = match.group(2)

            equip_pattern = r'"equipamento_solicitado":\s*"[^"]*"'
            if re.search(equip_pattern, entry_body):
                new_body = re.sub(equip_pattern, f'"equipamento_solicitado": "{equip}"', entry_body)
                content = content.replace(match.group(0), new_body + entry_end)
            else:
                new_body = entry_body.rstrip() + f',\n    "equipamento_solicitado": "{equip}"'
                content = content.replace(match.group(0), new_body + entry_end)
            applied += 1
        else:
            print(f"  WARNING: IBGE {ibge} not found in dados_municipios_full.js")

    if content != original:
        with open(path, 'w') as f:
            f.write(content)
        print(f"Updated {applied} entries in dados_municipios_full.js")
    else:
        print("No changes needed for dados_municipios_full.js")

    return applied

# ============================================================
# Now update dados_municipios.json
# ============================================================

def update_dados_municipios_json():
    path = r'C:\Users\Windows\Documents\gestao\15_Projetos\segov-dashboard-react\src\data\dados_municipios.json'
    with open(path) as f:
        data = json.load(f)

    municipios = data.get('municipios', [])
    applied = 0

    for mun in municipios:
        ibge = mun.get('ibge', '')
        if ibge in FINAL_EQUIP:
            old_equip = mun.get('equipamento_solicitado', '')
            new_equip = FINAL_EQUIP[ibge]
            if old_equip != new_equip:
                mun['equipamento_solicitado'] = new_equip
                applied += 1

    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Updated {applied} entries in dados_municipios.json")
    return applied

# ============================================================
# Run all updates
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Updating vehicles data from PDF 'Evento_MA_Sustentavel'")
    print("=" * 60)
    print(f"\nTotal IBGE mappings: {len(FINAL_EQUIP)}")

    # Count by type
    tractors = sum(1 for v in FINAL_EQUIP.values() if 'Trator agrícola' in v and 'Carro' not in v)
    retros = sum(1 for v in FINAL_EQUIP.values() if v == 'Retroescavadeira')
    carros_trator = sum(1 for v in FINAL_EQUIP.values() if 'Carro' in v and 'Trator agrícola' in v and 'Retroescavadeira' not in v)
    carros_retro = sum(1 for v in FINAL_EQUIP.values() if 'Carro' in v and 'Retroescavadeira' in v and 'Trator agrícola' not in v)

    print(f"\nBreakdown:")
    print(f"  Trator only: {tractors}")
    print(f"  Retro only: {retros}")
    print(f"  Carro + Trator: {carros_trator}")
    print(f"  Carro + Retro: {carros_retro}")
    print(f"  Total vehicles: {tractors + retros + carros_trator + carros_retro}")

    print("\n--- Updating municipios_217.js ---")
    n1 = update_municipios_217()

    print("\n--- Updating dados_municipios_full.js ---")
    n2 = update_dados_municipios_full()

    print("\n--- Updating dados_municipios.json ---")
    n3 = update_dados_municipios_json()

    print(f"\n✓ All updates complete: {n1} + {n2} + {n3}")
