import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useStore';
import { useData } from '../context/DataContext';
import '../styles/style.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const { filtroGrupo, setFiltroGrupo, busca, setBusca } = useData();
  const [theme, setTheme] = useState(localStorage.getItem('dashboard-tema') || 'light');

  const toggleTheme = (t) => {
    setTheme(t);
    localStorage.setItem('dashboard-tema', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return (
    <div className="main-wrapper">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">MA</div>
          <div><b>SEGOV-MA</b><span>Monitoramento Político</span></div>
        </div>
        <nav>
          <Link to="/" className={filtroGrupo === 'todos' ? 'active' : ''}>📊 Visão Geral</Link>
          <Link to="/mapa">🗺️ Mapa Político</Link>
          <Link to="/municipios">🏛️ Municípios</Link>
          <Link to="/obras">🏗️ Obras</Link>
          <Link to="/relatorios">📄 Relatórios</Link>
          <Link to="/admin">⚙️ Admin</Link>
        </nav>
        <div className="footer">v3.0 React · 217 municípios<br />© Governo do Maranhão</div>
      </aside>

      <div className="main">
        <div className="topbar">
          <h2 id="tituloPagina">Painel de Controle</h2>
          <div className="userbox">
            <span>📅 {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <div className="theme-switcher" style={{ display: 'flex', gap: '3px' }}>
              <button className="btn small" onClick={() => toggleTheme('light')}>☀️</button>
              <button className="btn small" onClick={() => toggleTheme('dark')}>🌙</button>
            </div>
            <span id="nomeUsuario">{user?.name}</span>
            <div className="avatar">{user?.name?.[0]}</div>
            <button className="btn danger small" onClick={logout}>🚪 Sair</button>
          </div>
        </div>

        <div className="content">
          <div className="filtros">
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>🎯 GRUPO:</span>
            {['todos', 'Brandão', 'Braide', 'neutro', 'indefinido'].map(g => (
              <button 
                key={g} 
                className={`chip ${filtroGrupo === g ? 'on' : ''}`}
                onClick={() => setFiltroGrupo(g)}
              >
                {g === 'todos' ? 'Todos' : g === 'Brandão' ? '🔵 Orleans' : g === 'Braide' ? '🟠 Braide' : g === 'neutro' ? '🟡 Neutro' : '⚪ Indefinido'}
              </button>
            ))}
            <input 
              type="text" 
              id="busca" 
              placeholder="🔍 Buscar município..." 
              style={{ marginLeft: 'auto' }} 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
