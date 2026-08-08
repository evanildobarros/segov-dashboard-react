import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { useStore } from '../hooks/useStore';
import { CORES, abbrevName } from '../data/municipios';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CHART_COLORS = {
  textColor: '#7a8a99',
  gridColor: 'rgba(0,0,0,0.05)'
};

function getChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    textColor: isDark ? '#bdc3c7' : '#7a8a99',
    gridColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
  };
}

// Distribuição por Grupo (Donut)
export function ChartDistribuicaoGrupos({ municipios }) {
  const { grupo } = useStore();
  const colors = getChartColors();
  
  const counts = {
    'Brandão': 0,
    'Braide': 0,
    'neutro': 0,
    'indefinido': 0
  };
  
  municipios.forEach(m => {
    if (counts[m.grupo] !== undefined) counts[m.grupo]++;
  });
  
  const data = {
    labels: ['Orleans Brandão', 'Braide', 'Neutro', 'Indefinido'],
    datasets: [{
      data: [counts['Brandão'], counts['Braide'], counts['neutro'], counts['indefinido']],
      backgroundColor: ['#2980B9', '#E67E22', '#F1C40F', '#BDC3C7'],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };
  
  return (
    <div style={{ height: '300px' }}>
      <Doughnut
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: colors.textColor, font: { size: 11 }, padding: 16 }
            }
          },
          cutout: '60%'
        }}
      />
    </div>
  );
}

// Lideranças por Município (Bar)
export function ChartLiderancas({ municipios }) {
  const colors = getChartColors();
  
  const sorted = [...municipios].sort((a, b) => b.total_liderancas - a.total_liderancas).slice(0, 15);
  
  const data = {
    labels: sorted.map(m => abbrevName(m.nome)),
    datasets: [{
      label: 'Lideranças',
      data: sorted.map(m => m.total_liderancas),
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
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { color: colors.textColor, stepSize: 2 },
              grid: { color: colors.gridColor }
            },
            x: {
              ticks: { color: colors.textColor, font: { size: 9 }, maxRotation: 45, minRotation: 30, autoSkip: false },
              grid: { display: false }
            }
          }
        }}
      />
    </div>
  );
}

// Obras por Status (Stacked Bar)
export function ChartObrasStatus({ municipios }) {
  const colors = getChartColors();
  
  const sorted = [...municipios].sort((a, b) => b.total_obras - a.total_obras).slice(0, 15);
  
  const data = {
    labels: sorted.map(m => abbrevName(m.nome)),
    datasets: [
      { 
        label: 'Entregues', 
        data: sorted.map(m => m.obras_entregues || 0), 
        backgroundColor: '#2ecc71', 
        borderRadius: 2 
      },
      { 
        label: 'Em Andamento', 
        data: sorted.map(m => m.obras_em_andamento || 0), 
        backgroundColor: '#3498db', 
        borderRadius: 2 
      },
      { 
        label: 'Paradas', 
        data: sorted.map(m => m.obras_paradas || 0), 
        backgroundColor: '#e74c3c', 
        borderRadius: 2 
      },
      { 
        label: 'Não Iniciadas', 
        data: sorted.map(m => Math.max(0, (m.total_obras || 0) - (m.obras_em_andamento || 0) - (m.obras_entregues || 0) - (m.obras_paradas || 0))), 
        backgroundColor: '#95a5a6', 
        borderRadius: 2 
      }
    ]
  };
  
  return (
    <div style={{ height: '300px' }}>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: colors.textColor, font: { size: 10 } } },
            tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y || 0}` } }
          },
          scales: {
            x: { 
              stacked: true, 
              ticks: { color: colors.textColor, font: { size: 9 }, maxRotation: 45, minRotation: 30, autoSkip: false },
              grid: { display: false } 
            },
            y: { 
              stacked: true, 
              beginAtZero: true, 
              ticks: { color: colors.textColor, stepSize: 1 },
              grid: { color: colors.gridColor } 
            }
          }
        }}
      />
    </div>
  );
}