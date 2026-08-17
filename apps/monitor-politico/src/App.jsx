import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { PainelMunicipio } from './components/PainelMunicipio';
import { VisaoGeral } from './pages/VisaoGeral';
import { PaginaMapa } from './pages/PaginaMapa';
import { PaginaMunicipios } from './pages/PaginaMunicipios';
import { PaginaObras } from './pages/PaginaObras';
import { PaginaAlertas } from './pages/PaginaAlertas';
import { PaginaRelatorio } from './pages/PaginaRelatorio';
import { useStore } from './lib/store';

export default function App() {
  const initTema = useStore((s) => s.initTema);
  const menuAberto = useStore((s) => s.menuAberto);
  const fecharMenu = useStore((s) => s.fecharMenu);

  useEffect(() => { initTema(); }, [initTema]);

  return (
    <div className="app">
      <Sidebar />
      {menuAberto && <div className="overlay" onClick={fecharMenu} />}

      <div className="conteudo">
        <Topbar />
        <Routes>
          <Route path="/" element={<VisaoGeral />} />
          <Route path="/mapa" element={<PaginaMapa />} />
          <Route path="/municipios" element={<PaginaMunicipios />} />
          <Route path="/obras" element={<PaginaObras />} />
          <Route path="/alertas" element={<PaginaAlertas />} />
          <Route path="/relatorio" element={<PaginaRelatorio />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <PainelMunicipio />
    </div>
  );
}
