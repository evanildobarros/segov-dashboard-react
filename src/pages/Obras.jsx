import { useStore } from '../hooks/useStore';
import { ChartSituacao, ChartInvestimento } from '../components/ChartsObras';

export function ObrasPage() {
  const { getMunicipiosFiltrados } = useStore();
  const municipiosFiltrados = getMunicipiosFiltrados();
  
  // KPIs específicos de obras
  const totalObras = municipiosFiltrados.reduce((s, m) => s + (m.total_obras || 0), 0);
  const totalInvestimento = municipiosFiltrados.reduce((s, m) => {
    const val = parseFloat(String(m.investimento_planner || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    return s + val;
  }, 0);
  
  const formatCurrency = (val) => {
    if (!val) return '—';
    if (val >= 1e6) return `R$ ${(val/1e6).toFixed(2)} mi`;
    if (val >= 1e3) return `R$ ${(val/1e3).toFixed(1)} mil`;
    return `R$ ${val.toFixed(0)}`;
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '14px', 
        marginBottom: '14px' 
      }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#0b3c5d', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Obras</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b3c5d', marginTop: '4px' }}>{totalObras}</div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', marginTop: '2px' }}>no PLANNER SEGOV</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#1b9e5a', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Investimento Total</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b3c5d', marginTop: '4px' }}>{formatCurrency(totalInvestimento)}</div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>🏗️ Obras por Situação</h3>
          <ChartSituacao municipios={municipiosFiltrados} />
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>💰 Top 10 Investimento</h3>
          <ChartInvestimento municipios={municipiosFiltrados} />
        </div>
      </div>
    </div>
  );
}