// Processa e exporta os dados dos municípios
import municipiosData from './dados_municipios.json';
import eixosData from './eixos_obras.json';

// Cores por grupo
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

// 8 municípios prioritários (IBGE codes)
export const PRIORITY_IBGES = new Set([
  '2105104',  // Icatu
  '2106631',  // Matões do Norte
  '2110005',  // Santa Luzia
  '2111607',  // São Raimundo das Mangabeiras
  '2111250',  // São José dos Basílios
  '2103901',  // Duque Bacelar
  '2111078',  // São João do Soter
  '2110278'   // Santo Amaro do Maranhão
]);

// Normaliza string para busca
export function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Processa municípios: merge dados_municipios.json (detalhado) com eixos_obras.json
function processMunicipios() {
  const baseMunicipios = municipiosData.municipios || [];
  
  // Cria mapa de eixos por IBGE
  const eixosMap = {};
  Object.entries(eixosData).forEach(([ibge, eixos]) => {
    eixosMap[ibge] = eixos;
  });

  // Enriquece cada município com dados de eixos
  return baseMunicipios.map(m => ({
    ...m,
    eixos: eixosMap[m.ibge] || {},
    isPriority: PRIORITY_IBGES.has(m.ibge),
    cor: CORES[m.grupo] || '#555',
    grupoLabel: LABELS[m.grupo] || m.grupo
  }));
}

export const MUNICIPIOS = processMunicipios();
export const MUNICIPIOS_PRIORITARIOS = MUNICIPIOS.filter(m => m.isPriority);
export const MUNICIPIOS_BY_IBGE = Object.fromEntries(MUNICIPIOS.map(m => [m.ibge, m]));

// Estatísticas
export function getStats(municipios = MUNICIPIOS) {
  return {
    total: municipios.length,
    orleans: municipios.filter(m => m.grupo === 'Brandão').length,
    braide: municipios.filter(m => m.grupo === 'Braide').length,
    neutro: municipios.filter(m => m.grupo === 'neutro').length,
    indefinido: municipios.filter(m => m.grupo === 'indefinido').length,
    totalObras: municipios.reduce((s, m) => s + (m.total_obras || 0), 0),
    totalLiderancas: municipios.reduce((s, m) => s + (m.total_liderancas || 0), 0),
    totalInvestimento: municipios.reduce((s, m) => {
      const val = parseFloat(String(m.investimento_planner || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
      return s + val;
    }, 0)
  };
}

// Formata moeda
export function formatCurrency(val) {
  if (!val) return '—';
  const num = typeof val === 'string' 
    ? parseFloat(val.replace(/[R$\s.]/g, '').replace(',', '.')) 
    : Number(val);
  if (isNaN(num)) return '—';
  if (num >= 1e6) return `R$ ${(num/1e6).toFixed(2)} mi`;
  if (num >= 1e3) return `R$ ${(num/1e3).toFixed(1)} mil`;
  return `R$ ${num.toFixed(0)}`;
}

// Abrevia nome do município para gráficos
export function abbrevName(nome) {
  if (!nome) return '';
  const fixos = {
    'São Raimundo das Mangabeiras': 'S. Raimundo das Mang.',
    'São João do Soter': 'S. J. do Soter',
    'São José dos Basílios': 'S. J. dos Basílios',
    'Santo Amaro do Maranhão': 'Sto. Amaro',
    'Matões do Norte': 'Matões do N.'
  };
  if (fixos[nome]) return fixos[nome];
  return nome.split(' ').map(p => {
    if (p === 'São') return 'S.';
    if (p === 'Santo') return 'Sto.';
    return p;
  }).join(' ');
}