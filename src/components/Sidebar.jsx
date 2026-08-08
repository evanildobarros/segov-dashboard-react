import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Map, MapPin, Building2, Hammer, FileText, Settings, LogOut, Sun, Moon, Menu, X, ChevronRight } from 'lucide-react';

const PAGES = [
  { id: 'dashboard', label: 'Visão Geral', icon: MapPin },
  { id: 'mapa', label: 'Mapa Político', icon: Map },
  { id: 'municipios', label: 'Municípios', icon: Building2 },
  { id: 'obras', label: 'Obras', icon: Hammer },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
  { id: 'admin', label: 'Admin', icon: Settings }
];

export function Sidebar() {
  const { modo, setModo, tema, setTema, logout, user } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  
  return (
    <aside style={{
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      width: collapsed ? '72px' : '232px',
      background: '#0b3c5d',
      color: '#cfe0ec',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      transition: 'width 0.2s ease',
      overflow: 'hidden'
    }}>
      {/* Brand */}
      <div style={{
        padding: '18px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        minHeight: '72px'
      }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '8px',
          background: '#1b9e5a', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: 800, color: '#fff',
          fontSize: '13px', flexShrink: 0
        }}>MA</div>
        {!collapsed && (
          <div>
            <b style={{ color: '#fff', fontSize: '14px', display: 'block' }}>SEGOV-MA</b>
            <span style={{ fontSize: '10.5px', color: '#9fb8ca' }}>Monitoramento Político</span>
          </div>
        )}
      </div>
      
      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
        {PAGES.map(page => {
          const Icon = page.icon;
          const isActive = modo === page.id;
          return (
            <button
              key={page.id}
              onClick={() => setModo(page.id)}
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
              {!collapsed && <span>{page.label}</span>}
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
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {!collapsed && (
          <>
            <div>v3.0 · 217 municípios</div>
            <div>© Governo do Maranhão</div>
          </>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '3px' }}>
            <button onClick={() => setTema('light')} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#cfe0ec', cursor: 'pointer', borderRadius: '4px' }}><Sun size={16} /></button>
            <button onClick={() => setTema('dark')} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#cfe0ec', cursor: 'pointer', borderRadius: '4px' }}><Moon size={16} /></button>
          </div>
          {!collapsed && (
            <>
              <span style={{ flex: 1 }}>{user?.name || 'Evanildo'}</span>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0b3c5d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>E</div>
              <button onClick={logout} style={{ padding: '6px 10px', border: '1px solid rgba(192,57,43,0.3)', background: 'transparent', color: '#c0392b', borderRadius: '7px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LogOut size={14} /> Sair
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}