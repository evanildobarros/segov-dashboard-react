import { NavLink } from 'react-router-dom';
import { Radar, LayoutDashboard, Map, Building2, HardHat, AlertTriangle, FileBarChart } from 'lucide-react';
import { useStore } from '../lib/store';
import { MUNICIPIOS, TODAS_OBRAS } from '../lib/dados';

const ITENS = [
  { grupo: 'Panorama', links: [
    { to: '/', fim: true, rotulo: 'Visão geral', icone: LayoutDashboard },
    { to: '/mapa', rotulo: 'Mapa político', icone: Map },
  ]},
  { grupo: 'Território', links: [
    { to: '/municipios', rotulo: 'Municípios', icone: Building2, badge: MUNICIPIOS.length },
    { to: '/obras', rotulo: 'Carteira de obras', icone: HardHat, badge: TODAS_OBRAS.length },
  ]},
  { grupo: 'Inteligência', links: [
    { to: '/alertas', rotulo: 'Radar de risco', icone: AlertTriangle },
    { to: '/relatorio', rotulo: 'Relatório', icone: FileBarChart },
  ]},
];

export function Sidebar() {
  const aberta = useStore((s) => s.menuAberto);
  const fechar = useStore((s) => s.fecharMenu);

  return (
    <aside className={`sidebar ${aberta ? 'sidebar--aberta' : ''}`}>
      <div className="sidebar__marca">
        <div className="sidebar__logo"><Radar size={19} /></div>
        <div className="col" style={{ gap: 0 }}>
          <span className="sidebar__titulo">Radar Político</span>
          <span className="sidebar__sub">Maranhão · 2026</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {ITENS.map((secao) => (
          <div key={secao.grupo}>
            <div className="sidebar__grupo">{secao.grupo}</div>
            {secao.links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.fim}
                onClick={fechar}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item--ativo' : ''}`}
              >
                <l.icone size={17} />
                <span>{l.rotulo}</span>
                {l.badge != null && <span className="nav-item__badge">{l.badge}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar__rodape">
        <div>Base: pesquisa territorial 2026</div>
        <div>{MUNICIPIOS.length} municípios monitorados</div>
      </div>
    </aside>
  );
}
