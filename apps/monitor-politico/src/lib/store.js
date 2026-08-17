import { create } from 'zustand';
import { MUNICIPIOS, normalizar } from './dados';

const FILTROS_INICIAIS = {
  busca: '',
  grupo: 'todos',
  mesorregiao: 'todas',
  somentePrioritarios: false,
  ordenacao: 'nome',
};

export const useStore = create((set, get) => ({
  ...FILTROS_INICIAIS,
  tema: 'claro',
  menuAberto: false,
  municipioSelecionado: null,

  setBusca: (busca) => set({ busca }),
  setGrupo: (grupo) => set({ grupo }),
  setMesorregiao: (mesorregiao) => set({ mesorregiao }),
  togglePrioritarios: () => set((s) => ({ somentePrioritarios: !s.somentePrioritarios })),
  setOrdenacao: (ordenacao) => set({ ordenacao }),
  limparFiltros: () => set({ ...FILTROS_INICIAIS }),

  setMunicipioSelecionado: (ibge) => set({ municipioSelecionado: ibge }),
  toggleMenu: () => set((s) => ({ menuAberto: !s.menuAberto })),
  fecharMenu: () => set({ menuAberto: false }),

  initTema: () => {
    const salvo = localStorage.getItem('radar-tema') || 'claro';
    document.documentElement.dataset.tema = salvo;
    set({ tema: salvo });
  },
  alternarTema: () => {
    const novo = get().tema === 'claro' ? 'escuro' : 'claro';
    localStorage.setItem('radar-tema', novo);
    document.documentElement.dataset.tema = novo;
    set({ tema: novo });
  },

  filtrar: () => {
    const { busca, grupo, mesorregiao, somentePrioritarios, ordenacao } = get();
    let lista = MUNICIPIOS;

    if (grupo !== 'todos') lista = lista.filter((m) => m.grupo === grupo);
    if (mesorregiao !== 'todas') lista = lista.filter((m) => m.mesorregiao === mesorregiao);
    if (somentePrioritarios) lista = lista.filter((m) => m.prioritario || m.flagEstrategico);

    if (busca.trim()) {
      const q = normalizar(busca);
      lista = lista.filter(
        (m) => m.chave.includes(q) || normalizar(m.prefeito).includes(q) || normalizar(m.partido).includes(q),
      );
    }

    const ordenadores = {
      nome: (a, b) => a.nome.localeCompare(b.nome, 'pt-BR'),
      risco: (a, b) => b.risco - a.risco,
      obras: (a, b) => b.totalObras - a.totalObras,
      investimento: (a, b) => b.investimento - a.investimento,
      liderancas: (a, b) => b.totalLiderancas - a.totalLiderancas,
    };
    return [...lista].sort(ordenadores[ordenacao] || ordenadores.nome);
  },
}));

/** Hook derivado: recalcula quando qualquer filtro muda. */
export function useMunicipiosFiltrados() {
  const busca = useStore((s) => s.busca);
  const grupo = useStore((s) => s.grupo);
  const meso = useStore((s) => s.mesorregiao);
  const prio = useStore((s) => s.somentePrioritarios);
  const ord = useStore((s) => s.ordenacao);
  const filtrar = useStore((s) => s.filtrar);
  // dependências apenas para forçar recomputação
  void busca; void grupo; void meso; void prio; void ord;
  return filtrar();
}
