import { useEffect, useState, useMemo, useCallback } from 'react';
import { useStore } from '../hooks/useStore';
import { ChartSituacao } from '../components/ChartsObras';
import { ChartEixos } from '../components/ChartEixos';
import { formatCurrency } from '../data/municipios';
import eixosDataRaw from '../data/eixos_obras.json';

// Ícones SVG simples para eixos
const EIXO_ICONS = {
  POÇOS: '🚰',
  EDUCAÇÃO: '🏫',
  'ESCOLA MILITAR - BOMBEIRO': '🎓',
  'ESPORTE E LAZER': '⚽',
  DELEGACIAS: '🚓',
  SAÚDE: '🏥',
  'SEGURANÇA/PM': '🛡️',
  PORTAL: '🖥️',
  'ESTAÇÃO TECH': '📡',
  PRAÇA: '🪑',
  AGED: '📋',
  IEMA: '🌱',
  'PATRIMÔNIO E INSTITUCIONAL': '🏛️',
  OUTROS: '—'
};

const EIXO_LABELS = {
  POÇOS: 'Águas/Poços',
  EDUCAÇÃO: 'Educação',
  'ESCOLA MILITAR - BOMBEIRO': 'Escola Militar',
  'ESPORTE E LAZER': 'Esporte/Lazer',
  DELEGACIAS: 'Delegacias',
  SAÚDE: 'Saúde',
  'SEGURANÇA/PM': 'Segurança',
  PORTAL: 'Portal',
  'ESTAÇÃO TECH': 'Estação Tech',
  PRAÇA: 'Praças',
  AGED: 'AGED',
  IEMA: 'IEMA',
  'PATRIMÔNIO E INSTITUCIONAL': 'Patrimônio'
};

function getListaEixos(municipios = []) {
  const seen = new Set();
  municipios.forEach(mun => {
    const obras = mun?.eixos && Array.isArray(mun.eixos) ? mun.eixos : [];
    obras.forEach(obra => {
      const orgao = obra.orgao || 'OUTROS';
      if (!seen.has(orgao) && (orgao !== 'OUTROS' || !municipios.find(m => (m?.eixos || []).some(o => o.orgao === 'OUTROS')))) {
        seen.add(orgao);
      }
    });
  });
  return Array.from(seen).sort();
}

export function ObrasPage() {
  const { getMunicipiosFiltrados, municipios, setGrupo } = useStore();
  const [view, setView] = useState('todos');
  const [eixoSelected, setEixoSelected] = useState(null);

  useEffect(() => {
    setGrupo('todos');
  }, [setGrupo]);

  const municipiosFiltrados = getMunicipiosFiltrados();
  const allEixos = useMemo(() => getListaEixos(municipios), [municipios]);

  // Filtrar por eixo (órgão) dentro do eixos array de cada município
  const listaExibicao = useMemo(() => {
    return municipios.filter(m => {
      const { grupo, busca } = useStore.getState();
      let match = true;
      if (grupo && grupo !== 'todos') {
        match = match && (m.grupo === grupo);
      }
      if (busca) {
        const q = busca.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        match = match && (
          (m.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q) ||
          (m.prefeito || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
        );
      }
      // Filtra por eixo/orgão
      if (eixoSelected) {
        const obras = m?.eixos && Array.isArray(m.eixos) ? m.eixos : [];
        match = match && obras.some(o => o.orgao === eixoSelected);
      }
      return match;
    });
  }, [municipios, eixoSelected]);

  const totalObras = listaExibicao.reduce((s, m) => s + (m.total_obras || 0), 0);
  const totalInvestimento = listaExibicao.reduce((s, m) => {
    const val = parseFloat(String(m.investimento_planner || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    return s + val;
  }, 0);

  // Contar municípios prioritários na lista filtrada
  const totalPrioritarios = listaExibicao.reduce((s, m) => s + (m.prioritario ? 1 : 0), 0);
  const totalVisiveis = listaExibicao.length;

  const toggleEixo = useCallback((eixo) => {
    setEixoSelected(prev => prev === eixo ? null : eixo);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
      {/* KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '14px'
      }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#0b3c5d', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Obras</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b3c5d', marginTop: '4px' }}>{totalObras}</div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>no PLANNER SEGOV</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#1b9e5a', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Investimento Total</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b3c5d', marginTop: '4px' }}>{formatCurrency(totalInvestimento)}</div>
        </div>
      </div>

      {/* Barra de Filtros - estilo similar ao screenshot */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Label Filtro */}
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Filtro:</span>

        {/* Filtro de Eixos de Obras */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setEixoSelected(null)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#475569',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            Todos os Eixos
          </button>
          {allEixos.map((eixo) => {
            const icon = EIXO_ICONS[eixo] || '🏗️';
            const label = EIXO_LABELS[eixo] || eixo;
            const isActive = eixoSelected === eixo;
            return (
              <button
                key={eixo}
                onClick={() => toggleEixo(eixo)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: isActive ? '#0b3c5d' : '#fff',
                  color: isActive ? '#fff' : '#334155',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={label}
              >
                <span style={{ fontSize: '13px' }}>{icon}</span>
                {label.length > 14 ? label.substring(0, 14) + '…' : label}
              </button>
            );
          })}
        </div>

        {/* Espaçador flexível */}
        <div style={{ flex: 1 }} />

        {/* Filtro de Prioridades (select no lugar de botões) */}
                <select
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  <option value="prioritarios">
                    ⭐ Prioritários ({totalPrioritarios})
                  </option>
                  <option value="todos">Todos ({totalVisiveis})</option>
                </select>
      </div>

      {/* Charts Grid */}
      <div className="dashboard-charts-grid">
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>🏗️ Obras por Situação</h3>
          <ChartSituacao municipios={listaExibicao} />
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>🏗️ Eixos de Investimento</h3>
          <ChartEixos municipios={listaExibicao} />
        </div>
      </div>
    </div>
  );
}
