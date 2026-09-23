import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Sun, Moon, LogOut, Menu } from 'lucide-react';

export function Topbar() {
  const { setTema, tema, user, logout, toggleMobileMenu } = useStore();
  const modo = useLocation().pathname.slice(1) || 'dashboard';
  const [date] = useState(() => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
  
  const titulos = {
    dashboard: 'Visão Geral',
    mapa: 'Mapa Político',
    municipios: 'Municípios',
    obras: 'Obras',
    equipamentos: 'Veículos',
    relatorios: 'Relatórios',
    admin: 'Administração'
  };

  // Formata o nome do usuário (ex: evanildobarros -> Evanildo Barros)
  const formatUserName = (name) => {
    if (!name) return 'Usuário';
    if (name === 'evanildobarros') return 'Evanildo Barros';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };
  
  return (
    <header className="app-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          title="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <h2 style={{ fontSize: '17px', color: 'var(--heading)', margin: 0 }}>
          {titulos[modo] || modo}
        </h2>
      </div>
      
      <div className="topbar-actions">
        <span className="topbar-date">📅 {date}</span>
        
        <div className="theme-switcher">
          <button onClick={() => setTema('light')} aria-pressed={tema === 'light'} title="Modo Claro">
            <Sun size={16} />
          </button>
          <button onClick={() => setTema('dark')} aria-pressed={tema === 'dark'} title="Modo Escuro">
            <Moon size={16} />
          </button>
        </div>
        
        <div className="user-profile-section">
          <span className="topbar-username">{formatUserName(user?.name)}</span>
          <div className="user-avatar">
            {(user?.name || 'E').charAt(0).toUpperCase()}
          </div>
          <button onClick={logout} className="logout-btn" aria-label="Sair">
            <LogOut size={16} /> <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}