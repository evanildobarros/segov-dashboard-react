// Utilitários compartilhados de obras — PLANNER SEGOV
// Enriquecimento: o D1 só popula `eixos` p/ 52 municípios prioritários;
// os demais 165 chegam com `eixos = []`. Este módulo completa com o
// snapshot completo do PLANNER (eixos_obras.json: 217 municípios / 3.125 obras).
import eixosDataRaw from '../data/eixos_obras.json';

export function normalizeNome(s) {
  return String(s || '').toUpperCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Lookup: nome normalizado → obras do PLANNER
const EIXOS_POR_MUNICIPIO = (() => {
  const map = {};
  Object.entries(eixosDataRaw || {}).forEach(([nome, obras]) => {
    map[normalizeNome(nome)] = Array.isArray(obras) ? obras : [];
  });
  return map;
})();

// Retorna o município com eixos garantidos (D1 quando preenchido, senão PLANNER)
export function enriquecerMunicipios(municipios = []) {
  return municipios.map(m => {
    const temEixos = m?.eixos && Array.isArray(m.eixos) && m.eixos.length > 0;
    if (temEixos) return m;
    const fallback = EIXOS_POR_MUNICIPIO[normalizeNome(m.nome)];
    if (!fallback || fallback.length === 0) return m;
    return { ...m, eixos: fallback };
  });
}

// Previsão de conclusão inferida do status/% do PLANNER
export function previsaoConclusao(obra) {
  const status = (obra.status || '').toUpperCase();
  const pct = typeof obra.pct === 'number' ? obra.pct : 0;
  if (/CONCLU|ENTREGUE|INAUGURADA/.test(status) || pct >= 100) return 'Concluída';
  if (/EXECU|ANDAMENTO|MOBILIZA/.test(status)) return 'Em andamento — conclusão a definir';
  if (/AG\. APROVA|APROVA/.test(status)) return 'Aguardando aprovação orçamentária';
  if (/AG\. PROJETO|PROJETO E ORC/.test(status)) return 'Aguardando projeto e orçamento';
  if (/PARALISADA|PARADA|SUSPENSA/.test(status)) return 'Paralisada — sem previsão definida';
  if (pct > 0) return `Em execução (${pct}%) — conclusão a definir`;
  return 'A iniciar — sem previsão informada';
}
