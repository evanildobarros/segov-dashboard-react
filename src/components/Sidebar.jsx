import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../hooks/useStore';
import { Map, MapPin, Building2, Hammer, FileText, Settings, LogOut, Sun, Moon, Menu, X, ChevronRight } from 'lucide-react';

const PAGES = [
  { id: 'dashboard', label: 'Visão Geral', icon: MapPin },
  { id: 'mapa', label: 'Mapa Político', icon: Map },
  { id: 'municipios', label: 'Municípios', icon: Building2 },
  { id: 'obras', label: 'Obras', icon: Hammer },
  { id: 'equipamentos', label: 'Equipamentos', icon: Settings },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
  { id: 'admin', label: 'Admin', icon: Settings }
];

export function Sidebar() {
  const { modo, setModo, setTema, logout, user, isMobileMenuOpen, closeMobileMenu } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname.substring(1) || 'dashboard';
    if (currentPath !== modo) {
      setModo(currentPath);
    }
  }, [location.pathname, modo, setModo]);

  const handlePageClick = (pageId) => {
    // Reset filtros ao mudar de página (exceto se for a mesma página)
    const currentModo = useStore.getState().modo;
    if (pageId !== currentModo) {
      useStore.getState().resetFiltros();
    }
    setModo(pageId);
    closeMobileMenu();
    navigate('/' + pageId);
  };
  
  return (
    <aside className={`app-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      {/* Brand */}
      <div style={{
        padding: '18px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        minHeight: '72px',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '8px',
            background: '#1b9e5a', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, color: '#fff',
            fontSize: '13px', flexShrink: 0
          }}>MA</div>
          <div>
            <b style={{ color: '#fff', fontSize: '14px', display: 'block' }}>SEGOV-MA</b>
            <span style={{ fontSize: '10.5px', color: '#9fb8ca' }}>Monitoramento Político</span>
          </div>
        </div>

        <button 
          className="mobile-close-btn"
          onClick={closeMobileMenu}
          style={{ background: 'transparent', border: 'none', color: '#cfe0ec', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {PAGES.map(page => {
          const Icon = page.icon;
          const isActive = modo === page.id;
          return (
            <button
              key={page.id}
              onClick={() => handlePageClick(page.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: '8px',
                color: isActive ? '#fff' : '#cfe0ec',
                background: isActive ? '#1b9e5a' : 'transparent',
                textDecoration: 'none', fontSize: '13.5px',
                marginBottom: '3px', cursor: 'pointer',
                border: 'none', width: '100%',
                textAlign: 'left',
                transition: 'background 0.2s'
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span>{page.label}</span>
            </button>
          );
        })}
      </nav>
      
      {/* Footer */}
      <div style={{
        padding: '12px 16px',
        fontSize: '10.5px',
        color: '#7fa0b8',
        borderTop: '1px solid rgba(255,255,255,0.12)',
      }}>
        <div>v3.0 · 217 municípios</div>
        <div>© Governo do Maranhão</div>
      </div>
    </aside>
  );
}