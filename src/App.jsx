import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from './hooks/useStore';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { FiltrosGlobais } from './components/FiltrosGlobais';
import { DashboardPage } from './pages/Dashboard';
import { MapaPoliticoPage } from './pages/MapaPolitico';
import { MunicipiosPage } from './pages/Municipios';
import { ObrasPage } from './pages/Obras';
import { RelatoriosPage } from './pages/Relatorios';
import { AdminPage } from './pages/Admin';
import { Login } from './pages/Login';
import './App.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, checkAuth } = useStore();
  
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useStore();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

function Layout() {
  const { modo } = useStore();
  
  const isLogin = window.location.pathname === '/login';
  
  if (isLogin) {
    return <Outlet />;
  }
  
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ 
        marginLeft: '232px', 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        background: '#f4f6f8'
      }}>
        <Topbar />
        <main style={{ flex: 1, padding: '0 24px 24px' }}>
          <FiltrosGlobais />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  const { initTema, checkAuth } = useStore();
  
  useEffect(() => {
    initTema();
    checkAuth();
  }, [initTema, checkAuth]);
  
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/mapa" element={<MapaPoliticoPage />} />
        <Route path="/municipios" element={<MunicipiosPage />} />
        <Route path="/obras" element={<ObrasPage />} />
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}

export default App;