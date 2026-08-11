import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore, useAuth } from './hooks/useStore';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { FiltrosGlobais } from './components/FiltrosGlobais';
import { BottomNav } from './components/BottomNav';
import { DashboardPage } from './pages/Dashboard';
import { MapaPoliticoPage } from './pages/MapaPolitico';
import { MunicipiosPage } from './pages/Municipios';
import { ObrasPage } from './pages/Obras';
import { EquipamentosPage } from './pages/Equipamentos';
import { RelatoriosPage } from './pages/Relatorios';
import { AdminPage } from './pages/Admin';
import { Login } from './pages/Login';
import './App.css';
import './index.css';
import './styles/topbar-mobile.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, checkAuth } = useAuth();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function Layout() {
  const { isMobileMenuOpen, closeMobileMenu } = useStore();
  const location = useLocation();
  
  const isLogin = location.pathname === '/login';
  const isAdmin = location.pathname === '/admin';

  if (isLogin) {
    return <Outlet />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay"
          onClick={closeMobileMenu}
        />
      )}
      <div className="main-wrapper">
        <Topbar />
        <main className="main-content">
          {!isAdmin && <FiltrosGlobais />}
          <Outlet />
        </main>
        {!isAdmin && <BottomNav />}
      </div>
    </div>
  );
}

function App() {
  const { initTema, checkAuth, fetchMunicipios } = useStore();
  
  useEffect(() => {
    initTema();
    checkAuth();
    fetchMunicipios(); // Carrega dados do D1 uma vez no mount
  }, [initTema, checkAuth, fetchMunicipios]);
  
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/mapa" element={<MapaPoliticoPage />} />
        <Route path="/municipios" element={<MunicipiosPage />} />
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/equipamentos" element={<EquipamentosPage />} />
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}

export default App;

