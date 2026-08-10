import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { ChartSituacao, ChartInvestimento } from '../components/ChartsObras';
import { formatCurrency } from '../data/municipios';

export function ObrasPage() {
  const { getMunicipiosFiltrados, municipios, setGrupo } = useStore();
  const [view, setView] = useState('todos'); // Default: Todos (217) para melhor UX
  
  // Reset filtro ao montar a página
  useEffect(() => {
    setGrupo('todos');
  }, [setGrupo]);
  
  const municipiosFiltrados = getMunicipiosFiltrados();
  
  // Quando view === 'todos', ignora o filtro do modo e usa todos os 217
  const listaExibicao = view === 'prioritarios' 
    ? municipiosFiltrados 
    : municipios.filter(m => {
        const { grupo, busca } = useStore.getState();
        let match = true;
        if (grupo && grupo !== 'todos') {
          match = match && (m.grupo === grupo);
        }
        if (busca) {
          const q = busca.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
          match = match && (
            (m.nome || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').includes(q) ||
            (m.prefeito || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').includes(q)
          );
        }
        return match;
      });

  // KPIs específicos de obras
  const totalObras = listaExibicao.reduce((s, m) => s + (m.total_obras || 0), 0);
  const totalInvestimento = listaExibicao.reduce((s, m) => {
    const val = parseFloat(String(m.investimento_planner || '0').replace(/[R$\\s.]/g, '').replace(',', '.')) || 0;
    return s + val;
  }, 0);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '14px'
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
      
      {/* Toggle de visualização */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button 
          onClick={() => setView('prioritarios')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #dde3ea',
            background: view === 'prioritarios' ? '#0b3c5d' : '#fff',
            color: view === 'prioritarios' ? '#fff' : '#22313f',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Prioritários (8)
        </button>
        <button 
          onClick={() => setView('todos')}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #dde3ea',
            background: view === 'todos' ? '#0b3c5d' : '#fff',
            color: view === 'todos' ? '#fff' : '#22313f',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Todos (217)
        </button>
      </div>
      
      <div className="dashboard-charts-grid">
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>🏗️ Obras por Situação</h3>
          <ChartSituacao municipios={listaExibicao} />
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>💰 Top 10 Investimento</h3>
          <ChartInvestimento municipios={listaExibicao} />
        </div>
      </div>
    </div>
  );
}