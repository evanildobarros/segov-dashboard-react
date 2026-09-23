import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, Building2, Hammer, Menu } from 'lucide-react';
import { useStore } from '../hooks/useStore';
export function BottomNav({ isMobileMenuOpen }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toggleMenu = useStore(s => s.toggleMobileMenu);
  const items = [{ id: 'dashboard', label: 'Início', icon: LayoutDashboard }, { id: 'mapa', label: 'Mapa', icon: Map }, { id: 'municipios', label: 'Municípios', icon: Building2 }, { id: 'obras', label: 'Obras', icon: Hammer }];
  return <nav aria-label="Navegação principal" className={`bottom-nav ${isMobileMenuOpen ? 'bottom-nav-hidden' : ''}`}>
    {items.map(({ id, label, icon: Icon }) => <button key={id} className={`bottom-nav-item ${pathname === '/' + id ? 'active' : ''}`} aria-current={pathname === '/' + id ? 'page' : undefined} onClick={() => navigate('/' + id)}><Icon size={20} /><span>{label}</span></button>)}
    <button className={`bottom-nav-item ${['/equipamentos', '/relatorios', '/admin'].includes(pathname) ? 'active' : ''}`} aria-label="Mais páginas" aria-expanded={isMobileMenuOpen} onClick={toggleMenu}><Menu size={20} /><span>Mais</span></button>
  </nav>;
}
