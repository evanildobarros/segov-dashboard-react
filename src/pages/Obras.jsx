import { useState, useMemo } from 'react';
import { useMunicipiosFiltrados } from '../hooks/useStore';
import { ChartSituacao } from '../components/ChartsObras';
import { ChartEixos } from '../components/ChartEixos';
import { TabelaObras } from '../components/TabelaObras';
import { ObrasListView } from '../components/ObrasListView';
import { enriquecerMunicipios, situacaoCanonica } from '../utils/obrasEnrich';

export function ObrasPage() {
  const municipiosRaw = useMunicipiosFiltrados();
  const [viewMode, setViewMode] = useState(() => window.matchMedia('(max-width: 640px)').matches ? 'lista' : 'tabela');
  const listaExibicao = useMemo(() => enriquecerMunicipios(municipiosRaw), [municipiosRaw]);

  // KPIs globais (filtros por eixo/situação/município ficam dentro da tabela)
  const totalObras = useMemo(() => {
    // Usa total_obras, mas valida contra soma de status para consistência
    const somaStatus = listaExibicao.reduce((s, m) => {
      const ent = Number(m.obras_entregues) || 0;
      const and = Number(m.obras_em_andamento) || 0;
      const par = Number(m.obras_paradas) || 0;
      return s + ent + and + par;
    }, 0);
    const somaTotal = listaExibicao.reduce((s, m) => s + (m.total_obras || 0), 0);
    return somaTotal > 0 ? somaTotal : somaStatus;
  }, [listaExibicao]);

  const totalConcluidas = useMemo(() => {
    return listaExibicao.reduce((s, m) => {
      const obs = (m?.eixos && Array.isArray(m.eixos)) ? m.eixos : [];
      return s + obs.filter(o => situacaoCanonica(o) === 'CONCLUIDA').length;
    }, 0);
  }, [listaExibicao]);

  const totalEmAndamento = useMemo(() => {
    return listaExibicao.reduce((s, m) => {
      const obs = (m?.eixos && Array.isArray(m.eixos)) ? m.eixos : [];
      return s + obs.filter(o => situacaoCanonica(o) === 'ANDAMENTO').length;
    }, 0);
  }, [listaExibicao]);

  const totalParalisadas = useMemo(() => {
    return listaExibicao.reduce((s, m) => {
      const obs = (m?.eixos && Array.isArray(m.eixos)) ? m.eixos : [];
      return s + obs.filter(o => situacaoCanonica(o) === 'PARALISADA').length;
    }, 0);
  }, [listaExibicao]);

  // Estilo reutilizável para barra lateral dos KPIs (evita }}>{{ repetido no JSX)
  const kpiBarStyle = { position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', borderRadius: '3px' };
  const kpiLabelStyle = { fontSize: '11px', color: 'var(--texto-secundario)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' };
  const kpiValueStyle = { fontSize: '24px', fontWeight: 800, marginTop: '3px' };
  const kpiSubStyle = { fontSize: '11px', color: 'var(--texto-secundario)', marginTop: '2px' };
  const kpiCardStyle = { background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '14px 16px', position: 'relative', overflow: 'hidden' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
      <p className="scope-note">Resumo dos municípios selecionados. Os filtros de descrição, eixo e situação abaixo refinam apenas a tabela.</p>
      {/* ===================== KPIs DINÂMICOS ===================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {/* Total Obras */}
        <div style={kpiCardStyle}>
          <div style={{ ...kpiBarStyle, background: '#0b3c5d' }} />
          <div style={kpiLabelStyle}>Total Obras</div>
          <div style={{ ...kpiValueStyle, color: 'var(--heading)' }}>
            {totalObras}
          </div>
          <div style={kpiSubStyle}>no PLANNER SEGOV</div>
        </div>

        {/* Concluídas */}
        <div style={kpiCardStyle}>
          <div style={{ ...kpiBarStyle, background: '#1b9e5a' }} />
          <div style={kpiLabelStyle}>Concluídas</div>
          <div style={{ ...kpiValueStyle, color: '#1b9e5a' }}>
            {totalConcluidas}
          </div>
          <div style={kpiSubStyle}>com pct ≥ 100%</div>
        </div>

        {/* Em Andamento */}
        <div style={kpiCardStyle}>
          <div style={{ ...kpiBarStyle, background: '#f59e0b' }} />
          <div style={kpiLabelStyle}>Em Andamento</div>
          <div style={{ ...kpiValueStyle, color: '#f59e0b' }}>
            {totalEmAndamento}
          </div>
          <div style={kpiSubStyle}>
            {totalEmAndamento > 0 ? 'com pct 1-99%' : ''}
          </div>
        </div>

        {/* Paralisadas */}
        <div style={kpiCardStyle}>
          <div style={{ ...kpiBarStyle, background: '#ef4444' }} />
          <div style={kpiLabelStyle}>Paralisadas</div>
          <div style={{ ...kpiValueStyle, color: '#ef4444' }}>
            {totalParalisadas}
          </div>
          <div style={kpiSubStyle}>com status paralisado</div>
        </div>
      </div>

      {/* Filtro de município/eixo/situação disponível dentro da tabela — barra superior removida por redundância */}

      {/* ===================== ALTERNÂNCIA TABELA / LISTA ===================== */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '12px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '15px', color: 'var(--heading)', margin: 0 }}>
            📋 Obras por Município
          </h3>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-muted)', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => setViewMode('tabela')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                borderRadius: '6px', cursor: 'pointer',
                background: viewMode === 'tabela' ? '#0b3c5d' : 'transparent',
                color: viewMode === 'tabela' ? '#fff' : 'var(--texto-secundario)',
                border: 'none'
              }}
            >
              📊 Tabela
            </button>
            <button
              onClick={() => setViewMode('lista')}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', fontSize: '12px', fontWeight: 600,
                borderRadius: '6px', cursor: 'pointer',
                background: viewMode === 'lista' ? '#0b3c5d' : 'transparent',
                color: viewMode === 'lista' ? '#fff' : 'var(--texto-secundario)',
                border: 'none'
              }}
            >
              📋 Lista/Cards
            </button>
          </div>
        </div>
      </div>

      {/* ===================== CONTEÚDO ===================== */}
      {viewMode === 'tabela' ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '12px', padding: '18px 20px' }}>
          <TabelaObras municipios={listaExibicao} />
        </div>
      ) : (
        <ObrasListView municipios={listaExibicao} />
      )}

      {/* ===================== CHARTS ===================== */}
      <div className="dashboard-charts-grid">
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--heading)', marginBottom: '12px' }}>🏗️ Obras por Situação</h3>
          <ChartSituacao municipios={listaExibicao} />
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--heading)', marginBottom: '12px' }}>🏗️ Eixos de Investimento</h3>
          <ChartEixos municipios={listaExibicao} />
        </div>
      </div>
    </div>
  );
}
