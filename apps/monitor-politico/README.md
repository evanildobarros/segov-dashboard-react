# Radar Político

App de monitoramento político territorial construído do zero, reaproveitando as bases de dados
já existentes neste repositório (217 municípios do Maranhão + carteira de obras por eixo).

É uma aplicação **independente** do dashboard SEGOV original — vive em `apps/monitor-politico`
e não altera nada do app da raiz.

## Rodando

```bash
cd apps/monitor-politico
npm install
npm run dev      # http://localhost:5180
npm run build    # bundle de produção em dist/
```

## Módulos

| Rota | Tela | O que entrega |
|------|------|----------------|
| `/` | Visão geral | KPIs, distribuição por grupo, composição regional, radar de atenção, índice de domínio |
| `/mapa` | Mapa político | Coropleto Leaflet dos 217 municípios, colorido por grupo, com filtros refletidos no mapa |
| `/municipios` | Municípios | Tabela completa ordenável + exportação CSV |
| `/obras` | Carteira de obras | 259 obras detalhadas, investimento por eixo, filtro por situação |
| `/alertas` | Radar de risco | 5 regras automáticas de alerta político |
| `/relatorio` | Relatório executivo | Síntese textual e tabular, pronta para impressão/PDF |

Clicar em qualquer município (mapa, tabela ou card) abre o **dossiê lateral** com gestão,
base política, obras e contatos.

## Índice de atenção política

Score sintético de 0 a 100 calculado em `src/lib/dados.js` (`scorePrioridade`), combinando:

- alinhamento do município (oposição e indefinidos pesam mais);
- marcação como prioritário / estratégico;
- taxa de entrega das obras (quanto menor, maior o risco);
- obras paradas ou pendentes;
- presença de lideranças mapeadas (reduz o risco).

## Fontes de dados

- `src/data/municipios.json` — cópia de `src/data/dados_municipios.json` da raiz (217 municípios).
- `src/data/eixos_obras.json` — cópia de `src/data/eixos_obras.json` da raiz (53 municípios com
  carteira detalhada, 259 obras, R$ 369,7 mi).
- `public/ma_municipios.min.geojson` — malha municipal do IBGE (cobertura de 217/217).

Os dados são estáticos e resolvidos em tempo de build — o app funciona sem backend.

## Estrutura

```
src/
  lib/dados.js      modelo de dados, normalização, métricas e formatação
  lib/store.js      estado global (Zustand): filtros, tema, seleção
  components/       Sidebar, Topbar, Filtros, UI, MapaPolitico, PainelMunicipio
  pages/            uma tela por rota
  styles/global.css design system (tokens, tema claro/escuro, responsivo)
```
