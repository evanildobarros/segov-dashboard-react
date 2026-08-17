/**
 * Camada de dados do Radar Político.
 * Reaproveita os datasets do repositório (municípios + eixos/obras) e
 * produz um modelo único, normalizado e enriquecido com métricas derivadas.
 */
import municipiosRaw from '../data/municipios.json';
import eixosRaw from '../data/eixos_obras.json';

/* ---------------------------------- cores --------------------------------- */

export const GRUPOS = {
  'Brandão': { label: 'Brandão', cor: '#2563eb', suave: '#dbeafe' },
  'Braide': { label: 'Braide', cor: '#ea580c', suave: '#ffedd5' },
  'neutro': { label: 'Neutro', cor: '#ca8a04', suave: '#fef9c3' },
  'indefinido': { label: 'Indefinido', cor: '#94a3b8', suave: '#f1f5f9' },
};

export const ORDEM_GRUPOS = ['Brandão', 'Braide', 'neutro', 'indefinido'];

export function corDoGrupo(grupo) {
  return (GRUPOS[grupo] || GRUPOS.indefinido).cor;
}

export function labelDoGrupo(grupo) {
  return (GRUPOS[grupo] || GRUPOS.indefinido).label;
}

/* ------------------------------- normalização ------------------------------ */

export function normalizar(txt = '') {
  return String(txt)
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['`´\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* --------------------------------- obras ---------------------------------- */

const STATUS_CONCLUIDO = new Set(['CONCLUÍDA', 'ENTREGUE', 'INAUGURADA']);
const STATUS_ANDAMENTO = new Set(['EM ANDAMENTO', 'MOBILIZAÇÃO', 'VISITA TÉCNICA']);
const STATUS_PARADO = new Set(['PARADA', 'AGUARDAR', 'PEND. INFORMAÇÕES']);

export function classificarStatus(status = '') {
  const s = String(status).toUpperCase().trim();
  if (STATUS_CONCLUIDO.has(s)) return 'concluida';
  if (STATUS_ANDAMENTO.has(s)) return 'andamento';
  if (STATUS_PARADO.has(s)) return 'parada';
  return 'planejada';
}

export const ROTULO_STATUS = {
  concluida: 'Concluída',
  andamento: 'Em andamento',
  parada: 'Parada / pendente',
  planejada: 'Em planejamento',
};

export const COR_STATUS = {
  concluida: '#16a34a',
  andamento: '#2563eb',
  parada: '#dc2626',
  planejada: '#94a3b8',
};

export const EIXOS = {
  1: 'Eixo 1 — Infraestrutura e mobilidade',
  2: 'Eixo 2 — Saneamento e água',
  3: 'Eixo 3 — Educação e equipamentos sociais',
  4: 'Eixo 4 — Desenvolvimento produtivo',
};

/* ------------------------------ carteira obras ----------------------------- */

// Indexa o dataset de eixos/obras por nome normalizado do município
const carteiraPorMunicipio = new Map();
for (const [nome, bloco] of Object.entries(eixosRaw)) {
  const obras = (bloco.obras || []).map((o, i) => ({
    id: `${normalizar(nome)}-${i}`,
    municipio: nome,
    descricao: (o.desc || '').replace(/\s*\n\s*/g, ' — ').trim(),
    statusOriginal: o.status || 'N/D',
    status: classificarStatus(o.status),
    progresso: Number(o.pct) || 0,
    orcamento: Number(o.orcamento) || 0,
    orgao: o.orgao || 'N/D',
    eixo: bloco.eixo,
  }));
  carteiraPorMunicipio.set(normalizar(nome), {
    eixo: bloco.eixo,
    investimento: Number(bloco.investimento) || 0,
    obras,
  });
}

/* ------------------------------- municípios -------------------------------- */

function scorePrioridade(m) {
  // Índice sintético de atenção política: quanto maior, mais exige acompanhamento.
  let score = 0;
  if (m.grupo === 'Braide') score += 38;
  else if (m.grupo === 'indefinido') score += 30;
  else if (m.grupo === 'neutro') score += 26;
  else score += 6;

  if (m.prioritario) score += 18;
  if (m.flagEstrategico) score += 8;

  // Baixa taxa de entrega das obras aumenta o risco
  const taxa = m.totalObras > 0 ? m.obrasEntregues / m.totalObras : 0;
  score += Math.round((1 - taxa) * 20);

  // Carteira relevante parada
  if (m.obrasParadas > 0) score += Math.min(10, m.obrasParadas * 3);

  // Presença de lideranças reduz o risco
  score -= Math.min(12, (m.totalLiderancas || 0) * 1.5);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export const MUNICIPIOS = (municipiosRaw.municipios || []).map((m) => {
  const chave = normalizar(m.nome);
  const carteira = carteiraPorMunicipio.get(chave);
  const obras = carteira?.obras || [];

  const obrasConcluidas = obras.filter((o) => o.status === 'concluida').length;
  const obrasAndamento = obras.filter((o) => o.status === 'andamento').length;
  const obrasParadas = obras.filter((o) => o.status === 'parada').length;
  const obrasPlanejadas = obras.filter((o) => o.status === 'planejada').length;

  const base = {
    ibge: String(m.ibge),
    nome: m.nome,
    chave,
    grupo: GRUPOS[m.grupo] ? m.grupo : 'indefinido',
    mesorregiao: m.mesorregiao || 'Não informada',
    prefeito: m.prefeito || '',
    partido: m.partido || '',
    prioritario: Boolean(m.prioritario),
    flagEstrategico: Boolean(m.flag_estrategico),
    alinhamento: m.alinhamento || '',
    assessor: m.assessor || '',
    detalhes: m.detalhes || '',
    eleitores: Number(m.eleitores) || 0,
    populacao: Number(m.populacao_estimada) || 0,

    totalLiderancas: Number(m.total_liderancas) || 0,
    apoiosBrandao: Number(m.apoios_orleans) || 0,
    apoiosBraide: Number(m.apoios_braide) || 0,
    apoiosNeutro: Number(m.apoios_neutro) || 0,

    totalObras: Number(m.total_obras) || 0,
    obrasEmAndamento: Number(m.obras_em_andamento) || 0,
    obrasEntregues: Number(m.obras_entregues) || 0,

    equipamento: m.equipamento_solicitado || '',
    contatos: { instagram: m.instagram || '', email: m.email || '', telefone: m.telefone || '', site: m.site || '' },

    // Carteira detalhada (só existe para parte dos municípios)
    temCarteira: Boolean(carteira),
    eixo: carteira?.eixo ?? null,
    investimento: carteira?.investimento ?? 0,
    obras,
    obrasConcluidas,
    obrasAndamento,
    obrasParadas,
    obrasPlanejadas,
  };

  base.taxaEntrega = base.totalObras > 0 ? base.obrasEntregues / base.totalObras : 0;
  base.risco = scorePrioridade(base);
  return base;
});

export const MUNICIPIOS_POR_IBGE = new Map(MUNICIPIOS.map((m) => [m.ibge, m]));
export const MUNICIPIOS_POR_CHAVE = new Map(MUNICIPIOS.map((m) => [m.chave, m]));

export const MESORREGIOES = [...new Set(MUNICIPIOS.map((m) => m.mesorregiao))].sort((a, b) =>
  a.localeCompare(b, 'pt-BR'),
);

export const PARTIDOS = [...new Set(MUNICIPIOS.map((m) => m.partido).filter(Boolean))].sort((a, b) =>
  a.localeCompare(b, 'pt-BR'),
);

/** Todas as obras da carteira detalhada, achatadas, com dados do município. */
export const TODAS_OBRAS = MUNICIPIOS.flatMap((m) =>
  m.obras.map((o) => ({ ...o, ibge: m.ibge, municipioNome: m.nome, grupo: m.grupo, mesorregiao: m.mesorregiao })),
);

export const METADATA = municipiosRaw.metadata || {};

/* --------------------------------- métricas -------------------------------- */

export function calcularIndicadores(lista) {
  const total = lista.length;
  const porGrupo = Object.fromEntries(ORDEM_GRUPOS.map((g) => [g, 0]));
  let liderancas = 0;
  let obras = 0;
  let entregues = 0;
  let andamento = 0;
  let investimento = 0;
  let eleitores = 0;
  let prioritarios = 0;

  for (const m of lista) {
    porGrupo[m.grupo] = (porGrupo[m.grupo] || 0) + 1;
    liderancas += m.totalLiderancas;
    obras += m.totalObras;
    entregues += m.obrasEntregues;
    andamento += m.obrasEmAndamento;
    investimento += m.investimento;
    eleitores += m.eleitores;
    if (m.prioritario) prioritarios += 1;
  }

  const base = total || 1;
  return {
    total,
    porGrupo,
    pctGrupo: Object.fromEntries(ORDEM_GRUPOS.map((g) => [g, (porGrupo[g] / base) * 100])),
    liderancas,
    obras,
    entregues,
    andamento,
    investimento,
    eleitores,
    prioritarios,
    taxaEntrega: obras > 0 ? entregues / obras : 0,
    // Índice de domínio: saldo entre base alinhada e oposição, de -100 a +100
    indiceDominio: ((porGrupo['Brandão'] - porGrupo['Braide']) / base) * 100,
  };
}

export function agruparPorMesorregiao(lista) {
  const mapa = new Map();
  for (const m of lista) {
    if (!mapa.has(m.mesorregiao)) {
      mapa.set(m.mesorregiao, { mesorregiao: m.mesorregiao, total: 0, ...Object.fromEntries(ORDEM_GRUPOS.map((g) => [g, 0])), obras: 0, investimento: 0 });
    }
    const r = mapa.get(m.mesorregiao);
    r.total += 1;
    r[m.grupo] += 1;
    r.obras += m.totalObras;
    r.investimento += m.investimento;
  }
  return [...mapa.values()].sort((a, b) => b.total - a.total);
}

/* -------------------------------- formatação ------------------------------- */

const fmtMoedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtNum = new Intl.NumberFormat('pt-BR');

export const moedaCompacta = (v) => fmtMoedaCompacta.format(Number(v) || 0);
export const moeda = (v) => fmtMoeda.format(Number(v) || 0);
export const numero = (v) => fmtNum.format(Number(v) || 0);
export const pct = (v, casas = 1) => `${(Number(v) || 0).toFixed(casas)}%`;
