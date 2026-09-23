import { useNavigate } from 'react-router-dom';
import { useStore, useMunicipiosFiltrados } from '../hooks/useStore';
import { KPICards } from '../components/KPICards';
import { ChartDistribuicaoGrupos, ChartLiderancas, ChartObrasStatus } from '../components/Charts';
import { ChartInvestimento } from '../components/ChartsObras';
import { formatCurrency, PRIORITY_IBGES, CORES, LABELS } from '../data/municipios';
import { Award, TrendingUp } from 'lucide-react';
export function DashboardPage() {
  const municipiosFiltrados = useMunicipiosFiltrados();
  const setMunicipioId = useStore(s => s.setMunicipioId);
  const resetFiltros = useStore(s => s.resetFiltros);
  const navigate = useNavigate();
  if (!municipiosFiltrados.length) return <section className="data-state"><h2>Nenhum município encontrado</h2><p>Experimente outra busca ou remova os filtros.</p><button className="primary-button" onClick={resetFiltros}>Limpar filtros</button></section>;
  // Indicadores e gráficos usam o mesmo recorte.
  const total = municipiosFiltrados.length || 1;
  const countBrandao = municipiosFiltrados.filter(m => m.grupo === 'Brandão').length;
  const countBraide = municipiosFiltrados.filter(m => m.grupo === 'Braide').length;
  const countNeutro = municipiosFiltrados.filter(m => m.grupo === 'neutro').length;
  const countIndefinido = municipiosFiltrados.filter(m => m.grupo === 'indefinido').length;

  const pctBrandao = ((countBrandao / total) * 100).toFixed(1);
  const pctBraide = ((countBraide / total) * 100).toFixed(1);
  const pctNeutro = ((countNeutro / total) * 100).toFixed(1);
  const pctIndefinido = ((countIndefinido / total) * 100).toFixed(1);

  // Municípios prioritários filtrados (respeita filtros atuais)
  const prioritariosList = municipiosFiltrados.filter(m => PRIORITY_IBGES.has(m.ibge));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
      
      {/* Cartões KPIs gerais */}
      <KPICards />

      {/* Barra de Distribuição do Balanço Político */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--borda)',
        borderRadius: '10px',
        padding: '18px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} /> Balanço de Força Político-Eleitoral
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 500 }}>
            Recorte atual: {municipiosFiltrados.length} municípios
          </span>
        </div>

        {/* Multi-color Progress bar */}
        <div style={{
          height: '14px',
          borderRadius: '7px',
          overflow: 'hidden',
          display: 'flex',
          background: '#e2e8f0',
          marginBottom: '16px'
        }}>
          <div style={{ width: `${pctBrandao}%`, background: '#2980B9', transition: 'width 0.3s' }} title={`Orleans Brandão: ${pctBrandao}%`} />
          <div style={{ width: `${pctBraide}%`, background: '#E67E22', transition: 'width 0.3s' }} title={`Braide: ${pctBraide}%`} />
          <div style={{ width: `${pctNeutro}%`, background: '#F1C40F', transition: 'width 0.3s' }} title={`Neutro/Empate: ${pctNeutro}%`} />
          <div style={{ width: `${pctIndefinido}%`, background: '#BDC3C7', transition: 'width 0.3s' }} title={`Indefinido: ${pctIndefinido}%`} />
        </div>

        {/* Legenda com Números */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: '8px', borderLeft: '4px solid #2980B9' }}>
            <div style={{ fontSize: '11px', color: 'var(--texto-secundario)', fontWeight: 600 }}>ORLEANS BRANDÃO</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--heading)' }}>
              {countBrandao} <small style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 500 }}>({pctBrandao}%)</small>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: '8px', borderLeft: '4px solid #E67E22' }}>
            <div style={{ fontSize: '11px', color: 'var(--texto-secundario)', fontWeight: 600 }}>BRAIDE</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--heading)' }}>
              {countBraide} <small style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 500 }}>({pctBraide}%)</small>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: '8px', borderLeft: '4px solid #F1C40F' }}>
            <div style={{ fontSize: '11px', color: 'var(--texto-secundario)', fontWeight: 600 }}>EMPATE / NEUTRO</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--heading)' }}>
              {countNeutro} <small style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 500 }}>({pctNeutro}%)</small>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: '8px', borderLeft: '4px solid #BDC3C7' }}>
            <div style={{ fontSize: '11px', color: 'var(--texto-secundario)', fontWeight: 600 }}>INDEFINIDO</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--heading)' }}>
              {countIndefinido} <small style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 500 }}>({pctIndefinido}%)</small>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos Executivos */}
      <div className="dashboard-charts-grid">
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--heading)', marginBottom: '14px' }}>
            📊 Distribuição da Base Política
          </h3>
          <ChartDistribuicaoGrupos municipios={municipiosFiltrados} />
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--heading)', marginBottom: '14px' }}>
            💰 Top Investimentos Planejados (R$)
          </h3>
          <ChartInvestimento municipios={municipiosFiltrados} />
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--heading)', marginBottom: '14px' }}>
            🏗️ Status Global de Obras Governamentais
          </h3>
          <ChartObrasStatus municipios={municipiosFiltrados} />
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--heading)', marginBottom: '14px' }}>
            👥 Mapeamento de Lideranças por Cidade
          </h3>
          <ChartLiderancas municipios={municipiosFiltrados} />
        </div>
      </div>

      {/* Destaque: 8 Municípios Prioritários */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', color: 'var(--heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award color="#e8b923" size={18} /> Municípios Prioritários em Foco ({prioritariosList.length})
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--texto-secundario)' }}>
              Cidades estratégicas com ações prioritárias e atenção governamental especial.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {prioritariosList.map(mun => {
            const corGrupo = CORES[mun.grupo] || '#555';
            return (
              <div 
                key={mun.ibge}
                role="button" tabIndex={0} aria-label={`Ver ${mun.nome} no mapa`}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMunicipioId(mun.ibge); navigate('/mapa'); } }}
                onClick={() => { setMunicipioId(mun.ibge); navigate('/mapa'); }}
                style={{
                  border: '1px solid var(--borda)',
                  borderRadius: '10px',
                  padding: '14px',
                  background: 'var(--surface-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0b3c5d';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--heading)' }}>
                    {mun.nome}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: corGrupo,
                    color: '#ffffff'
                  }}>
                    {LABELS[mun.grupo] || mun.grupo}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--texto)', marginBottom: '6px' }}>
                  <strong>Prefeito(a):</strong> {mun.prefeito || 'Não informado'}
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--texto-secundario)', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--borda)' }}>
                  <div>🏗️ <strong>{mun.total_obras || 0}</strong> Obras</div>
                  <div>💰 <strong>{formatCurrency(mun.investimento_planner)}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
