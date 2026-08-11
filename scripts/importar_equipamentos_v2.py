#!/usr/bin/env python3
"""
Atualiza dados_municipios.json com os equipamentos solicitados
dos 8 municípios prioritários — versão corrigida.
"""
import json
from pathlib import Path

DATA_PATH = Path(r"C:/Users/Windows/Documents/segov-dashboard-react/src/data/dados_municipios.json")

# Lista de 112 municípios com equipamentos
EQUIPAMENTOS = [
    ("Água Doce do Maranhão", "2100055", "Trator agrícola"),
    ("Alcântara", "2100105", "Trator agrícola"),
    ("Alto Parnaíba", "2100154", "Retroescavadeira"),
    ("Amapá do Maranhão", "2100204", "Trator agrícola"),
    ("Anapurus", "2100303", "Retroescavadeira"),
    ("Araioses", "2100402", "Trator agrícola"),
    ("Arame", "2100451", "Trator agrícola"),
    ("Axixá", "2100501", "Retroescavadeira"),
    ("Bacabeira", "2100600", "Retroescavadeira"),
    ("Bacuri", "2100709", "Trator agrícola"),
    ("Bacurituba", "2100808", "Trator agrícola"),
    ("Barão de Grajaú", "2100907", "Trator agrícola"),
    ("Bela Vista do Maranhão", "2101004", "Trator agrícola"),
    ("Benedito Leite", "2101103", "Trator agrícola"),
    ("Bequimão", "2101202", "Trator agrícola"),
    ("Brejo de Areia", "2101301", "Retroescavadeira"),
    ("Buriti Bravo", "2101400", "Retroescavadeira"),
    ("Buritirana", "2101509", "Trator agrícola"),
    ("Cachoeira Grande", "2101608", "Trator agrícola"),
    ("Cajapió", "2101707", "Retroescavadeira"),
    ("Cajari", "2101806", "Retroescavadeira"),
    ("Campestre do Maranhão", "2101905", "Trator agrícola"),
    ("Cantanhede", "2102004", "Trator agrícola"),
    ("Capinzal do Norte", "2102103", "Trator agrícola"),
    ("Carolina", "2102202", "Retroescavadeira"),
    ("Carutapera", "2102301", "Retroescavadeira"),
    ("Caxias", "2102400", "Trator agrícola"),
    ("Cidelândia", "2102509", "Retroescavadeira"),
    ("Codó", "2102608", "Retroescavadeira"),
    ("Colinas", "2102707", "Trator agrícola"),
    ("Coroatá", "2102806", "Retroescavadeira"),
    ("Cururupu", "2102905", "Trator agrícola"),
    ("Davinópolis", "2103003", "Trator agrícola"),
    ("Duque Bacelar", "2103901", "Retroescavadeira"),
    ("Esperantinópolis", "2104006", "Retroescavadeira"),
    ("Feira Nova do Maranhão", "2104105", "Trator agrícola"),
    ("Formosa da Serra Negra", "2104204", "Trator agrícola"),
    ("Fortaleza dos Nogueiras", "2104303", "Trator agrícola"),
    ("Godofredo Viana", "2104909", "Retroescavadeira"),
    ("Gonçalves Dias", "2105005", "Retroescavadeira"),
    ("Governador Archer", "2105158", "Trator agrícola"),
    ("Governador Edison Lobão", "2105307", "Retroescavadeira"),
    ("Governador Luiz Rocha", "2105406", "Trator agrícola"),
    ("Grajaú", "2105505", "Retroescavadeira"),
    ("Guimarães", "2105604", "Retroescavadeira"),  # Guimarães do Maranhão - IBGE 2105604?
    ("Icatu", "2105104", "Retroescavadeira"),
    ("Igarapé do Meio", "2105703", "Trator agrícola"),
    ("Itaipava do Grajaú", "2105802", "Trator agrícola"),
    ("Itapecuru Mirim", "2105901", "Retroescavadeira"),
    ("Itinga do Maranhão", "2106008", "Retroescavadeira"),
    ("Jatobá", "2106107", "Trator agrícola"),
    ("Junco do Maranhão", "2106206", "Trator agrícola"),
    ("Lago da Pedra", "2106305", "Retroescavadeira"),
    ("Lago do Junco", "2106404", "Trator agrícola"),
    ("Lago Verde", "2106503", "Trator agrícola"),  # Need correct IBGE
    ("Lagoa do Mato", "2106602", "Trator agrícola"),
    ("Lajeado Novo", "2106701", "Retroescavadeira"),
    ("Lima Campos", "2106800", "Retroescavadeira"),
    ("Loreto", "2106909", "Trator agrícola"),
    ("Luís Domingues", "2107006", "Trator agrícola"),
    ("Magalhães de Almeida", "2107105", "Trator agrícola"),
    ("Maracaçumé", "2107204", "Trator agrícola"),
    ("Marajá do Sena", "2107303", "Trator agrícola"),
    ("Matões", "2106557", "Trator agrícola"),  # Matões do Norte
    ("Mirador", "2107502", "Retroescavadeira"),
    ("Miranda do Norte", "2107601", "Trator agrícola"),
    ("Nina Rodrigues", "2107700", "Trator agrícola"),
    ("Nova Iorque", "2107809", "Trator agrícola"),
    ("Nova Olinda do Maranhão", "2107908", "Trator agrícola"),
    ("Olho d'Água das Cunhãs", "2108005", "Retroescavadeira"),
    ("Olinda Nova do Maranhão", "2108104", "Retroescavadeira"),
    ("Palmeirândia", "2108203", "Trator agrícola"),
    ("Passagem Franca", "2108302", "Trator agrícola"),
    ("Pastos Bons", "2108401", "Trator agrícola"),
    ("Paulo Ramos", "2108500", "Trator agrícola"),
    ("Pedro do Rosário", "2108609", "Trator agrícola"),
    ("Penalva", "2108708", "Retroescavadeira"),
    ("Peritoró", "2108807", "Trator agrícola"),
    ("Pinheiro", "2108906", "Retroescavadeira"),
    ("Poção de Pedras", "2109003", "Trator agrícola"),
    ("Porto Franco", "2109102", "Retroescavadeira"),
    ("Presidente Juscelino", "2109201", "Trator agrícola"),
    ("Presidente Médici", "2109300", "Retroescavadeira"),
    ("Primeira Cruz", "2109409", "Trator agrícola"),
    ("Raposa", "2109508", "Retroescavadeira"),
    ("Riachão", "2109607", "Trator agrícola"),
    ("Sambaíba", "2109706", "Trator agrícola"),
    ("Santa Filomena do Maranhão", "2109805", "Retroescavadeira"),
    ("Santa Quitéria do Maranhão", "2109904", "Retroescavadeira"),
    ("São Benedito do Rio Preto", "2110007", "Retroescavadeira"),
    ("São Bento", "2110106", "Retroescavadeira"),
    ("São Bernardo", "2110205", "Retroescavadeira"),
    ("São Félix de Balsas", "2110403", "Trator agrícola"),
    ("São Francisco do Brejão", "2110502", "Trator agrícola"),
    ("São Francisco do Maranhão", "2110601", "Trator agrícola"),
    ("São João Batista", "2110700", "Retroescavadeira"),
    ("São João do Sóter", "2111078", "Trator agrícola"),
    ("São José dos Basílios", "2111250", "Trator agrícola"),
    ("São Luís Gonzaga do Maranhão", "2110304", "Trator agrícola"),
    ("São Raimundo do Doca Bezerra", "2111300", "Trator agrícola"),
    ("São Roberto", "2111409", "Trator agrícola"),
    ("Senador Alexandre Costa", "2111508", "Trator agrícola"),
    ("Senador La Rocque", "2111607", "Trator agrícola"),
    ("Serrano do Maranhão", "2111706", "Retroescavadeira"),
    ("Timbiras", "2111805", "Retroescavadeira"),
    ("Trizidela do Vale", "2111904", "Retroescavadeira"),
    ("Tuntum", "2111953", "Retroescavadeira"),
    ("Turiaçu", "2112001", "Retroescavadeira"),
    ("Tutóia", "2112100", "Retroescavadeira"),
    ("Urbano Santos", "2112209", "Trator agrícola"),
    ("Viana", "2112308", "Retroescavadeira"),
    ("Vila Nova dos Martírios", "2112407", "Trator agrícola"),
    ("Santa Luzia", "2110005", "Trator agrícola"),
    ("Santo Amaro do Maranhão", "2110278", "Trator agrícola"),
    ("Matões do Norte", "2106631", "Trator agrícola"),
]


def main():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        d = json.load(f)

    # Build lookup: (nome_upper, ibge) → index
    ibge_to_idx = {m["ibge"]: i for i, m in enumerate(d["municipios"])}

    # Also build fuzzy name lookup with normalization
    import unicodedata
    def normalize(s):
        s = s.upper().strip()
        s = unicodedata.normalize('NFD', s).encode('ASCII', 'ignore').decode('ASCII')
        s = s.replace("'", "").replace("-", " ").replace("  ", " ")
        return s

    nome_to_idx = {}
    for i, m in enumerate(d["municipios"]):
        nome_to_idx[normalize(m["nome"])] = i
        nome_to_idx[m["nome"].strip().upper()] = i

    # Special handling for problematic ones
    # Guimarães → need to find exact match
    # Lago Verde → check
    # Matões → Matões do Norte

    updates = 0
    not_found = []

    for municipio_nome, ibge, equipamento in EQUIPAMENTOS:
        idx = None
        # Try IBGE first
        if ibge in ibge_to_idx:
            idx = ibge_to_idx[ibge]
        else:
            # Try name lookup
            norm = normalize(municipio_nome)
            if norm in nome_to_idx:
                idx = nome_to_idx[norm]
            # Try original name
            elif municipio_nome.strip().upper() in nome_to_idx:
                idx = nome_to_idx[municipio_nome.strip().upper()]

        if idx is not None:
            d["municipios"][idx]["equipamento_solicitado"] = equipamento
            d["municipios"][idx]["equipamento_categoria"] = (
                "Trator agrícola" if "trator" in equipamento.lower() else "Retroescavadeira"
            )
            updates += 1
        else:
            # Check if the IBGE exists at all
            all_ibges = [m["ibge"] for m in d["municipios"]]
            if ibge in all_ibges:
                idx = all_ibges.index(ibge)
                d["municipios"][idx]["equipamento_solicitado"] = equipamento
                updates += 1
            else:
                not_found.append((municipio_nome, ibge))

    # Update metadata
    trat = sum(1 for m in d["municipios"] if m.get("equipamento_solicitado"))
    retro = sum(1 for m in d["municipios"] if "retroescavadeira" in (m.get("equipamento_solicitado", "")).lower())
    trator = sum(1 for m in d["municipios"] if "trator agrícola" in (m.get("equipamento_solicitado", "")).lower())

    d["metadata"]["equipamentos"] = {
        "total_solicitados": trat,
        "tratores": trator,
        "retroescavadeiras": retro,
        "updated_at": d["metadata"].get("gerado_em", "")
    }

    DATA_PATH.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ Atualizado: {updates}/{len(EQUIPAMENTOS)} municípios")
    print(f"  Tratores: {trator}")
    print(f"  Retroescavadeiras: {retro}")
    print(f"  Total: {trat}")
    if not_found:
        print(f"⚠️ Não encontrados: {not_found}")
    print(f"📁 Salvo em: {DATA_PATH}")


if __name__ == "__main__":
    main()
