import { Bar } from 'react-chartjs-2';
import { useStore } from '../hooks/useStore';
import { CORES, LABELS } from '../data/municipios';

export function ChartSituacao({ municipios }) {
  const colors = {
    textColor: '#7a8a99',
    gridColor: 'rgba(0,0,0,0.05)'
  };
  
  const entregues = municipios.reduce((s, m) => s + (m.obras_entregues || 0), 0);
  const andamento = municipios.reduce((s, m) => s + (m.obras_em_andamento || 0), 0);
  const paradas = municipios.reduce((s, m) => s + (m.obras_paradas || 0), 0);
  const total = municipios.reduce((s, m) => s + (m.total_obras || 0), 0);
  const naoIniciadas = Math.max(0, total - entregues - andamento - paradas);
  
  const data = {
    labels: ['Situação'],
    datasets: [
      { label: 'Entregues', data: [entregues], backgroundColor: '#2ecc71' },
      { label: 'Em Andamento', data: [andamento], backgroundColor: '#3498db' },
      { label: 'Paradas', data: [paradas], backgroundColor: '#e74c3c' },
      { label: 'Não Iniciadas', data: [naoIniciadas], backgroundColor: '#95a5a6' }
    ]
  };
  
  return (
    <div style={{ height: '300px' }}>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { position: 'bottom', labels: { color: colors.textColor, font: { size: 10 } } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.x || 0}` } }
          },
          scales: {
            x: { stacked: true, beginAtZero: true, ticks: { color: colors.textColor }, grid: { color: colors.gridColor } },
            y: { stacked: true, ticks: { color: colors.textColor }, grid: { display: false } }
          }
        }}
      />
    </div>
  );
}

export function ChartInvestimento({ municipios }) {
  const colors = {
    textColor: '#7a8a99',
    gridColor: 'rgba(0,0,0,0.05)'
  };
  
  const formatCurrency = (val) => {
    if (!val) return '—';
    if (val >= 1e6) return `R$ ${(val/1e6).toFixed(2)} mi`;
    if (val >= 1e3) return `R$ ${(val/1e3).toFixed(1)} mil`;
    return `R$ ${val.toFixed(0)}`;
  };
  
  const sorted = [...municipios]
    .filter(m => m.investimento_planner)
    .sort((a, b) => {
      const va = parseFloat(String(a.investimento_planner).replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
      const vb = parseFloat(String(b.investimento_planner).replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
      return vb - va;
    })
    .slice(0, 10);
  
  const data = {
    labels: sorted.map(m => m.nome),
    datasets: [{
      label: 'Investimento (R$)',
      data: sorted.map(m => parseFloat(String(m.investimento_planner).replace(/[R$\s.]/g, '').replace(',', '.')) || 0),
      backgroundColor: sorted.map(m => CORES[m.grupo] || '#555'),
      borderRadius: 4
    }]
  };
  
  return (
    <div style={{ height: '300px' }}>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => `Investimento: ${formatCurrency(ctx.parsed.x)}` } }
          },
          scales: {
            x: { beginAtZero: true, ticks: { color: colors.textColor, callback: (v) => formatCurrency(v) }, grid: { color: colors.gridColor } },
            y: { ticks: { color: colors.textColor, font: { size: 9 } }, grid: { display: false } }
          }
        }}
      />
    </div>
  );
}