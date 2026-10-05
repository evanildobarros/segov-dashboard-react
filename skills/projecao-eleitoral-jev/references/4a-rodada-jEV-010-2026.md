---
name: projecao-eleitoral-jev-rerun-reference
description: Reference for 3rd/4th JEV rerun procedure (used in session 01/10/2026 — Viva Voz MA-04968 + Ranking MA-09047 + IPPI MA-08460 + structural 8 cities; deploy 2519965a-af13-41f1-b76b-776b89ab7744).
---

# 4ª Rodada JEV — Procedimento Verificado (01/10/2026)

## Ordem exata (não reconstruir do zero)

1. **Verificar fontes** — usar `projecao_fontes.json` (pols); confirmar `polls` contém as 17 fontes (Viva Voz, Ranking, IPPI, Quaest, IP Sensus, Real Time, etc.). Confirmar `chart:true` e `nota` para cada.
2. **Atualizar state** (`jev_projecao_state.json`):
   - Adicionar nova fonte em `pesquisas_1T_estimulada` (data, instituto, amostra, braide/orleans/camarao/rocha/others/indecisos, nota completa).
   - Atualizar `leitura_serie` (texto curto do contexto).
   - Atualizar `observacoes_metodologicas` (nota de ressalva de base válida, TSE MA, etc.).
3. **Persistir** state (não reconstruir a partir das planilhas — manter curadorias existentes).
4. **Rodar** `python rerun_jev_3009c.py` (carrega state existente, não destrói).
5. **Verificar saída** (`jev_projecao_result_3009c.json`): extrair `desfecho_1t` (escolha + conf), `desfecho_2t`, `prob_vitoria_braide` (nota + probs + conf), `prob_vitoria_orleans`, `fator_determinante`, `avaliacao_municipal_interna`, `mapa_apoio_final`.
6. **Comparar com rodada anterior** (3ª rodada: conf 1T 0.82, 2T 0.99, Braide 3.16). Registrar diferença de confiança/escolha no `revision` do JSON.
7. **Atualizar JSON dashboard** (`projecao_eleicoes_2026.json`): `state_metrics.jev_analysis` com novos campos + `gerado_em` do result.
8. **Atualizar espelho** (`10_mapas/dashboard/projecao_eleicoes_2026.json`).
9. **Build**: `NODE_OPTIONS="--max-old-space-size=3072" npm run build` (exit 0, validar sem `NaN`).
10. **Deploy**: `npx wrangler deploy` → validar `HTTP 200` em `/` e `/projecao`; confirmar hash do chunk publicado confere com local.

## Pitfalls desta rodada específica (01/10/2026)

- **IPPI MA-08460/2026 (55,4% Braide)** é a primeira fonte estadual > 50% — mas Ranking MA-09047/2026 (42,4%) está abaixo. O modelo não vira 1º turno automaticamente; mantém 2º turno com alta conf (0.84→0.82). A interpretação legal (Lei 9.504/1997 art. 29) deve ser registrada separadamente, não confundida com a confiança do JEV.
- **Não alterar mapa oficial** (156/38/23) — regra de evidência municipal preservada (18 indef / 4 Orleans / 1 Braide na 4ª rodada).
- **Nota técnica de fonte**: IPPI é estadual; Viva Voz é base válida; Ranking é válida; Grande Ilha é regional — manter cada uma em categoria distinta (`polls` vs `agregados_regionais_set2026`).
- **Cron**: após deploy, garantir que os 2 jobs de sincronização (`sync-gestao-diario` e `inventario-23h`) estão como `no_agent` + `script` — evite retorno do HTTP 429.
