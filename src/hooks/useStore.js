import { create } from 'zustand';
import { MUNICIPIOS, MUNICIPIOS_PRIORITARIOS, getStats } from '../data/municipios';

// Estado inicial
const initialState = {
  // Filtros globais
  grupo: 'todos',           // 'todos' | 'Brandão' | 'Braide' | 'neutro' | 'indefinido'
  busca: '',                // string de busca
  municipioId: null,        // IBGE selecionado
  modo: 'dashboard',        // 'dashboard' | 'mapa' | 'municipios' | 'obras' | 'relatorios' | 'admin'
  
  // Autenticação
  isAuthenticated: false,
  user: null,
  
  // Tema
  tema: 'light',            // 'light' | 'dark'
  
  // Dados
  municipios: MUNICIPIOS,
  municipiosPrioritarios: MUNICIPIOS_PRIORITARIOS,
  
  // Mapas
  mapInstance: null,
  mapGrandeInstance: null,
  geoJSONData: null,
};

export const useStore = create((set, get) => ({
  ...initialState,
  
  // Filtros
  setGrupo: (grupo) => set({ grupo }),
  setBusca: (busca) => set({ busca }),
  setMunicipioId: (municipioId) => set({ municipioId }),
  setModo: (modo) => set({ modo }),
  
  // Autenticação
  login: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null }),
  checkAuth: () => {
    const token = sessionStorage.getItem('segov_token');
    if (token) {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  
  // Tema
  setTema: (tema) => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem('dashboard-tema', tema);
    set({ tema });
  },
  initTema: () => {
    const saved = localStorage.getItem('dashboard-tema') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    set({ tema: saved });
  },
  
  // Mapas
  setMapInstance: (mapInstance) => set({ mapInstance }),
  setMapGrandeInstance: (mapInstance) => set({ mapGrandeInstance }),
  setGeoJSONData: (geoJSONData) => set({ geoJSONData }),
  
  // Getters computados
  getMunicipiosFiltrados: () => {
    const { municipios, grupo, busca, modo } = get();
    let lista = modo === 'municipios' ? MUNICIPIOS_PRIORITARIOS : municipios;
    
    if (grupo !== 'todos') {
      lista = lista.filter(m => m.grupo === grupo);
    }
    
    if (busca) {
      const q = busca.toLowerCase();
      lista = lista.filter(m => 
        m.nome.toLowerCase().includes(q) || 
        (m.prefeito || '').toLowerCase().includes(q)
      );
    }
    
    return lista;
  },
  
  getKPIs: () => {
    const filtrados = get().getMunicipiosFiltrados();
    return getStats(filtrados);
  },
  
  // Reset
  resetFiltros: () => set({ 
    grupo: 'todos', 
    busca: '', 
    municipioId: null 
  }),
}));

// Seletores para performance
export const useGrupo = () => useStore(state => state.grupo);
export const useBusca = () => useStore(state => state.busca);
export const useMunicipioId = () => useStore(state => state.municipioId);
export const useModo = () => useStore(state => state.modo);
export const useTema = () => useStore(state => state.tema);
export const useAuth = () => useStore(state => ({ 
  isAuthenticated: state.isAuthenticated, 
  user: state.user,
  login: state.login,
  logout: state.logout,
  checkAuth: state.checkAuth
}));
export const useMunicipios = () => useStore(state => state.municipios);
export const useMunicipiosFiltrados = () => useStore(state => state.getMunicipiosFiltrados());
export const useKPIs = () => useStore(state => state.getKPIs());
export const useMapInstance = () => useStore(state => state.mapInstance);
export const useMapGrandeInstance = () => useStore(state => state.mapGrandeInstance);
export const useGeoJSONData = () => useStore(state => state.geoJSONData);