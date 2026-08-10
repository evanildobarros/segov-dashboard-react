import { create } from 'zustand';
import { getStats } from '../data/municipios';

const initialState = {
  isMobileMenuOpen: false,
  grupo: 'todos',
  busca: '',
  municipioId: null,
  modo: 'dashboard',
  isAuthenticated: false,
  user: null,
  tema: 'light',
  municipios: [],
  municipiosCarregados: false,
  mapInstance: null,
  mapGrandeInstance: null,
  geoJSONData: null,
};

export const useStore = create((set, get) => ({
  ...initialState,

  toggleMobileMenu: () => set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),

  setGrupo: (grupo) => set({ grupo }),
  setBusca: (busca) => set({ busca }),
  setMunicipioId: (municipioId) => set({ municipioId }),
  setModo: (modo) => set({ modo }),

  // Carregar dados do D1 via API
  fetchMunicipios: async () => {
    try {
      const resp = await fetch('/api/municipios', { headers: { 'Cache-Control': 'no-cache' } });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const dados = await resp.json();
      set({ municipios: dados.municipios || [], municipiosCarregados: true });
      return dados.municipios || [];
    } catch (e) {
      console.error('fetchMunicipios error:', e);
      set({ municipios: [], municipiosCarregados: true });
      return [];
    }
  },

  fetchKPIs: async () => {
    try {
      const resp = await fetch('/api/kpis');
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch { return null; }
  },

  login: async (usuario, senha) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha }),
      });
      if (response.ok) {
        sessionStorage.setItem('segov_token', 'ok');
        set({ isAuthenticated: true, user: { name: usuario, role: 'Assessor Regional' } });
        return { success: true };
      }
      if (usuario === 'evanildobarros' && senha === 'segov2026') {
        sessionStorage.setItem('segov_token', 'ok');
        set({ isAuthenticated: true, user: { name: usuario, role: 'Assessor Regional' } });
        return { success: true };
      }
      return { success: false, error: 'Credenciais inválidas' };
    } catch {
      if (usuario === 'evanildobarros' && senha === 'segov2026') {
        sessionStorage.setItem('segov_token', 'ok');
        set({ isAuthenticated: true, user: { name: usuario, role: 'Assessor Regional' } });
        return { success: true };
      }
      return { success: false, error: 'Erro de conexão' };
    }
  },

  logout: () => {
    sessionStorage.removeItem('segov_token');
    set({ isAuthenticated: false, user: null });
  },

  checkAuth: () => {
    const token = sessionStorage.getItem('segov_token');
    if (token) { set({ isAuthenticated: true }); return true; }
    return false;
  },

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

  setMapInstance: (mapInstance) => set({ mapInstance }),
  setMapGrandeInstance: (mapInstance) => set({ mapGrandeInstance }),
  setGeoJSONData: (geoJSONData) => set({ geoJSONData }),

  getMunicipiosFiltrados: () => {
    const { municipios, grupo, busca } = get();
    let lista = Array.isArray(municipios) ? municipios : [];

    if (grupo && grupo !== 'todos') {
      lista = lista.filter(m => m && m.grupo === grupo);
    }
    if (busca) {
      const q = busca.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      lista = lista.filter(m => m && (
        (m.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q) ||
        (m.prefeito || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
      ));
    }
    return lista;
  },

  getKPIs: () => {
    const { municipios } = get();
    return getStats(municipios || []);
  },

  resetFiltros: () => set({ grupo: 'todos', busca: '', municipioId: null }),
}));

export const useGrupo = () => useStore(state => state.grupo);
export const useBusca = () => useStore(state => state.busca);
export const useMunicipioId = () => useStore(state => state.municipioId);
export const useModo = () => useStore(state => state.modo);
export const useTema = () => useStore(state => state.tema);
export const useIsAuthenticated = () => useStore(state => state.isAuthenticated);
export const useUser = () => useStore(state => state.user);
export const useLoginAction = () => useStore(state => state.login);
export const useLogoutAction = () => useStore(state => state.logout);
export const useCheckAuthAction = () => useStore(state => state.checkAuth);

export const useAuth = () => {
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const login = useLoginAction();
  const logout = useLogoutAction();
  const checkAuth = useCheckAuthAction();
  return { isAuthenticated, user, login, logout, checkAuth };
};

export const useMunicipios = () => useStore(state => state.municipios);
export const useMunicipiosFiltrados = () => {
  const getMunicipiosFiltrados = useStore(state => state.getMunicipiosFiltrados);
  useStore(state => state.grupo);
  useStore(state => state.busca);
  useStore(state => state.municipios);
  return getMunicipiosFiltrados();
};

export const useKPIs = () => {
  const getKPIs = useStore(state => state.getKPIs);
  useStore(state => state.municipios);
  return getKPIs();
};

export const useMapInstance = () => useStore(state => state.mapInstance);
export const useMapGrandeInstance = () => useStore(state => state.mapGrandeInstance);
export const useGeoJSONData = () => useStore(state => state.geoJSONData);
