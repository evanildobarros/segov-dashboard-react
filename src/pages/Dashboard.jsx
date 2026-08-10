import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { KPICards } from '../components/KPICards';
import { ChartDistribuicaoGrupos, ChartLiderancas, ChartObrasStatus } from '../components/Charts';
import { ChartInvestimento, ChartSituacao } from '../components/ChartsObras';
import { formatCurrency, PRIORITY_IBGES, CORES, LABELS } from '../data/municipios';
import { Building2, Hammer, Award, TrendingUp, ChevronRight, ShieldAlert, Sparkles, CheckCircle2, Search } from 'lucide-react';

export function DashboardPage() {
  const {
    fetchMunicipios,
    municipios,
    getMunicipiosFiltrados,
    setMunicipioId,
    setGrupo,
    setBusca,
    initTema
  } = useStore();

  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [carregando, setCarregando] = useState(!municipios.length);

  useEffect(() => {
    initTema();
    if (!municipios.length) {
      fetchMunicipios().then(() => setCarregando(false));
    } else {
      setCarregando(false);
    }
  }, [fetchMunicipios, initTema, municipios.length]);

  const municipiosFiltrados = getMunicipiosFiltrados();
  const kpis = useStore.getState().getKPIs();

  if (carregando || !municipios.length) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>🔄 Carregando dados do D1... 🗄️</div>
      </div>
    );
  }

  // Cálculos de percentuais políticos - USA TODOS OS 217 PARA VISÃO GERAL
  const total = municipios.length || 1;
  const countBrandao = municipios.filter(m => m.grupo === 'Brandão').length;
  const countBraide = municipios.filter(m => m.grupo === 'Braide').length;
  const countNeutro = municipios.filter(m => m.grupo === 'neutro').length;
  const countIndefinido = municipios.filter(m => m.grupo === 'indefinido').length;

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

      {/* Filtro por Município */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dde3ea',
        borderRadius: '10px',
        padding: '14px 18px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', color: '#7a8a99', fontWeight: 600, minWidth: '110px' }}>Filtrar município:</label>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              placeholder="Digite para buscar..."
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              style={{
                width: '100%', padding: '8px 32px 8px 10px',
                border: '1px solid #dde3ea', borderRadius: '7px',
                fontSize: '13px', background: '#fff', color: '#22313f',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#2980B9'}
              onBlur={(e) => e.target.style.borderColor = '#dde3ea'}
            />
            <Search size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
          {filtroMunicipio && (
            <button
              onClick={() => {
                setFiltroMunicipio('');
                setBusca('');
              }}
              style={{
                padding: '6px 12px', border: '1px solid #e2e8f0', background: '#f8fafc',
                borderRadius: '6px', fontSize: '12px', color: '#64748b', cursor: 'pointer'
              }}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Lista suspensa de municípios que começam com o filtro */}
        {filtroMunicipio.length >= 1 && (
          <div style={{
            maxHeight: '200px', overflowY: 'auto', marginTop: '8px',
            border: '1px solid #e2e8f0', borderRadius: '7px', background: '#fff'
          }}>
            {municipios
              .filter(m => m.nome.toLowerCase().includes(filtroMunicipio.toLowerCase()))
              .slice(0, 10)
              .map(m => (
                <div
                  key={m.ibge}
                  onClick={() => {
                    setBusca(m.nome);
                    setMunicipioId(m.ibge);
                    setFiltroMunicipio('');
                  }}
                  style={{
                    padding: '8px 12px', fontSize: '12.5px', color: '#22313f',
                    cursor: 'pointer', borderBottom: '1px solid #f1f5f9'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.cor || '#555', display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }}></span>
                  {m.nome}
                  <span style={{ float: 'right', color: '#7a8a99', fontSize: '11px' }}>
                    {m.prefeito ? m.prefeito.split('(')[0].trim() : ''}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Chips de municípios selecionados */}
        {municipiosFiltrados.length > 0 && municipiosFiltrados.length < 217 && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', padding: '4px 8px' }}>
              Exibindo {municipiosFiltrados.length} município(s)
            </span>
          </div>
        )}
      </div>

      {/* Barra de Distribuição do Balanço Político */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dde3ea',
        borderRadius: '10px',
        padding: '18px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} /> Balanço de Força Político-Eleitoral
          </h3>
          <span style={{ fontSize: '12px', color: '#7a8a99', fontWeight: 500 }}>
            Base Governista vs Oposição vs Neutros
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
          <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #2980B9' }}>
            <div style={{ fontSize: '11px', color: '#7a8a99', fontWeight: 600 }}>BASE BRANDÃO</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0b3c5d' }}>
              {countBrandao} <small style={{ fontSize: '12px', color: '#7a8a99', fontWeight: 500 }}>({pctBrandao}%)</small>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #E67E22' }}>
            <div style={{ fontSize: '11px', color: '#7a8a99', fontWeight: 600 }}>BASE BRAIDE</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0b3c5d' }}>
              {countBraide} <small style={{ fontSize: '12px', color: '#7a8a99', fontWeight: 500 }}>({pctBraide}%)</small>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #F1C40F' }}>
            <div style={{ fontSize: '11px', color: '#7a8a99', fontWeight: 600 }}>EMPATE / NEUTRO</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0b3c5d' }}>
              {countNeutro} <small style={{ fontSize: '12px', color: '#7a8a99', fontWeight: 500 }}>({pctNeutro}%)</small>
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #BDC3C7' }}>
            <div style={{ fontSize: '11px', color: '#7a8a99', fontWeight: 600 }}>INDEFINIDO</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0b3c5d' }}>
              {countIndefinido} <small style={{ fontSize: '12px', color: '#7a8a99', fontWeight: 500 }}>({pctIndefinido}%)</small>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Gráficos Executivos */}
      <div className="dashboard-charts-grid">
        <div style={{ background: '#ffffff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '14px' }}>
            📊 Distribuição da Base Política
          </h3>
          <ChartDistribuicaoGrupos municipios={municipiosFiltrados} />
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '14px' }}>
            💰 Top Investimentos Planejados (R$)
          </h3>
          <ChartInvestimento municipios={municipiosFiltrados} />
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '14px' }}>
            🏗️ Status Global de Obras Governamentais
          </h3>
          <ChartObrasStatus municipios={municipiosFiltrados} />
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '14px' }}>
            👥 Mapeamento de Lideranças por Cidade
          </h3>
          <ChartLiderancas municipios={municipiosFiltrados} />
        </div>
      </div>

      {/* Destaque: 8 Municípios Prioritários */}
      <div style={{ background: '#ffffff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '15px', color: '#0b3c5d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award color="#e8b923" size={18} /> Municípios Prioritários em Foco ({prioritariosList.length})
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7a8a99' }}>
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
                onClick={() => setMunicipioId(mun.ibge)}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  background: '#f8fafc',
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
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0b3c5d' }}>
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

                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                  <strong>Prefeito(a):</strong> {mun.prefeito || 'Não informado'}
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
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
