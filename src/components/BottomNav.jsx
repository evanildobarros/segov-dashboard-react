import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Map, Building2, Hammer, FileText, Settings } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const modo = useStore(state => state.modo);

  const navItems = [
    { id: 'dashboard', label: 'Geral', icon: MapPin },
    { id: 'mapa', label: 'Mapa', icon: Map },
    { id: 'municipios', label: 'Cidades', icon: Building2 },
    { id: 'obras', label: 'Obras', icon: Hammer },
    { id: 'relatorios', label: 'Relat.', icon: FileText },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = modo === item.id;
        return (
          <button 
            key={item.id} 
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate('/' + item.id)}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}