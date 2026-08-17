import { useLocation } from 'react-router-dom';
import { Menu, Search, Sun, Moon } from 'lucide-react';
import { useStore } from '../lib/store';

const TITULOS = {
  '/': ['Visão geral', 'Panorama do alinhamento político territorial'],
  '/mapa': ['Mapa político', 'Distribuição geográfica por grupo político'],
  '/municipios': ['Municípios', 'Base completa com filtros e ordenação'],
  '/obras': ['Carteira de obras', 'Execução física e financeira por município'],
  '/alertas': ['Radar de risco', 'Municípios que exigem atenção prioritária'],
  '/relatorio': ['Relatório executivo', 'Síntese consolidada para gestão'],
};

export function Topbar() {
  const { pathname } = useLocation();
  const [titulo, sub] = TITULOS[pathname] || ['Radar Político', ''];
  const busca = useStore((s) => s.busca);
  const setBusca = useStore((s) => s.setBusca);
  const toggleMenu = useStore((s) => s.toggleMenu);
  const tema = useStore((s) => s.tema);
  const alternarTema = useStore((s) => s.alternarTema);

  return (
    <header className="topbar">
      <button className="icone-btn menu-btn" onClick={toggleMenu} aria-label="Abrir menu">
        <Menu size={18} />
      </button>

      <div className="col topbar__info" style={{ gap: 0 }}>
        <span className="topbar__titulo">{titulo}</span>
        <span className="topbar__sub">{sub}</span>
      </div>

      <div className="topbar__busca">
        <Search size={15} />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar município, prefeito ou partido…"
          aria-label="Buscar"
        />
      </div>

      <button className="icone-btn" onClick={alternarTema} aria-label="Alternar tema">
        {tema === 'claro' ? <Moon size={17} /> : <Sun size={17} />}
      </button>
    </header>
  );
}
