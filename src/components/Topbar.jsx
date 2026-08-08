import { useStore } from '../hooks/useStore';
import { Sun, Moon, LogOut, User } from 'lucide-react';

export function Topbar() {
  const { tema, setTema, modo, user, logout } = useStore();
  const [date] = useState(() => new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }));
  
  const titulos = {
    dashboard: 'Visão Geral',
    mapa: 'Mapa Político',
    municipios: 'Municípios',
    obras: 'Obras',
    relatorios: 'Relatórios',
    admin: 'Admin'
  };
  
  return (
    <header style={{
      background: '#fff',
      borderBottom: '1px solid #dde3ea',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 900
    }}>
      <h2 style={{ fontSize: '17px', color: '#0b3c5d' }}>
        {titulos[modo] || modo}
      </h2>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '13px', color: '#7a8a99' }}>📅 {date}</span>
        
        <div style={{ display: 'flex', gap: '3px' }}>
          <button onClick={() => setTema('light')} style={{ 
            padding: '6px', border: '1px solid #dde3ea', background: '#fff', 
            borderRadius: '7px', cursor: 'pointer', fontSize: '12px', color: '#22313f' 
          }}><Sun size={16} /></button>
          <button onClick={() => setTema('dark')} style={{ 
            padding: '6px', border: '1px solid #dde3ea', background: '#fff', 
            borderRadius: '7px', cursor: 'pointer', fontSize: '12px', color: '#22313f' 
          }}><Moon size={16} /></button>
        </div>
        
        <span style={{ fontSize: '13px', color: '#22313f' }}>{user?.name || 'Evanildo'}</span>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0b3c5d', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px' }}>E</div>
        
        <button onClick={logout} style={{ 
          padding: '8px 14px', border: '1px solid rgba(192,57,43,0.3)', 
          background: '#fff', color: '#c0392b', borderRadius: '7px', 
          fontSize: '12.5px', fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <LogOut size={16} /> Sair
        </button>
      </div>
    </header>
  );
}