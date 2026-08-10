/* ============================================================
   dados.js — Carregamento e processamento de dados (React Version)
   ============================================================ */
import { ALL_MUNS } from './municipios_217';

export const PRIORITARIOS = [
  { ibge: '2105104', nome: 'Icatu', grupo: 'Brandão' },
  { ibge: '2106631', nome: 'Matões do Norte', grupo: 'Brandão' },
  { ibge: '2110005', nome: 'Santa Luzia', grupo: 'Brandão' },
  { ibge: '2111607', nome: 'São Raimundo das Mangabeiras', grupo: 'Brandão' },
  { ibge: '2111250', nome: 'São José dos Basílios', grupo: 'Brandão' },
  { ibge: '2103901', nome: 'Duque Bacelar', grupo: 'Brandão' },
  { ibge: '2111078', nome: 'São João do Soter', grupo: 'Brandão' },
  { ibge: '2110278', nome: 'Santo Amaro do Maranhão', grupo: 'Brandão' }
];

export { ALL_MUNS };

export const IBGE_PRIO = Object.fromEntries(PRIORITARIOS.map(p => [p.ibge, true]));

export const CORES = {
  'Brandão': '#2980B9',
  'Braide': '#E67E22',
  'neutro': '#F1C40F',
  'indefinido': '#BDC3C7'
};

export const LABELS = {
  'Brandão': 'Orleans Brandão',
  'Braide': 'Braide',
  'neutro': 'Empate / Neutro',
  'indefinido': 'Indefinido'
};

export function normalizar(nome) {
  return nome
    .toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/['\-]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

export async function carregarMunicipios(url = 'dados_municipios.json') {
  try {
    const resp = await fetch(url);
    const json = await resp.json();
    return json.municipios || [];
  } catch (e) {
    console.warn('Erro ao carregar dados_municipios.json, usando fallback');
    return [
      { ibge: '2105104', nome: 'Icatu', grupo: 'Brandão', cor: '#2980B9', prefeito: 'Walace Azevedo Mendes', partido: 'PSDB', total_liderancas: 13, total_obras: 23, obras_em_andamento: 5, obras_entregues: 2, eleitores: 42529, flag_estrategico: true },
      { ibge: '2106631', nome: 'Matões do Norte', grupo: 'Brandão', cor: '#2980B9', prefeito: 'Solimar Alves de Oliveira', partido: 'MDB', total_liderancas: 10, total_obras: 8, obras_em_andamento: 2, obras_entregues: 1, eleitores: 18672, flag_estrategico: true },
      { ibge: '2110005', nome: 'Santa Luzia', grupo: 'Brandão', cor: '#2980B9', prefeito: 'Jucelino Marreca', partido: 'PRD', total_liderancas: 19, total_obras: 20, obras_em_andamento: 6, obras_entregues: 6, eleitores: 15320, flag_estrategico: true },
      { ibge: '2110278', nome: 'Santo Amaro do Maranhão', grupo: 'Braide', cor: '#E67E22', prefeito: 'Leandro Oliveira da Silva (Leandro Moura)', partido: 'PCdoB', total_liderancas: 5, total_obras: 7, obras_em_andamento: 1, obras_entregues: 4, eleitores: 12456, flag_estrategico: true },
      { ibge: '2111078', nome: 'São João do Soter', grupo: 'neutro', cor: '#F1C40F', prefeito: 'Maria Do Carmo Cavalcante Lacerda', partido: 'n/d', total_liderancas: 11, total_obras: 0, obras_em_andamento: 0, obras_entregues: 0, eleitores: 8765, flag_estrategico: true },
      { ibge: '2111250', nome: 'São José dos Basílios', grupo: 'Brandão', cor: '#2980B9', prefeito: 'Ronaldo Vieira de Sousa Junior', partido: 'MDB', total_liderancas: 13, total_obras: 46, obras_em_andamento: 8, obras_entregues: 11, eleitores: 23456, flag_estrategico: true },
      { ibge: '2103901', nome: 'Duque Bacelar', grupo: 'Brandão', cor: '#2980B9', prefeito: 'Flávio Furtado', partido: 'PDT', total_liderancas: 0, total_obras: 14, obras_em_andamento: 0, obras_entregues: 0, eleitores: 7890, flag_estrategico: true },
      { ibge: '2111607', nome: 'São Raimundo das Mangabeiras', grupo: 'Brandão', cor: '#2980B9', prefeito: 'Accioly Cardoso', partido: 'MDB', total_liderancas: 16, total_obras: 12, obras_em_andamento: 4, obras_entregues: 6, eleitores: 15320, flag_estrategico: true }
    ];
  }
}

export async function carregarGeoJSON(url = 'ma_municipios.min.geojson') {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('Falha ao carregar ' + url);
  return resp.json();
}

export function getStats(municipios) {
  const total = municipios.length;
  const orleans = municipios.filter(m => m.grupo === 'Brandão').length;
  const braide = municipios.filter(m => m.grupo === 'Braide').length;
  const neutro = municipios.filter(m => m.grupo === 'neutro').length;
  const indefinido = municipios.filter(m => m.grupo === 'indefinido').length;
  const totalLiderancas = municipios.reduce((s, m) => s + (m.total_liderancas || 0), 0);

  return { total, orleans, braide, neutro, indefinido, totalLiderancas };
}
