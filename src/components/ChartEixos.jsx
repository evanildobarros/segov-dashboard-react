import { Bar } from 'react-chartjs-2';
import { CORES } from '../data/municipios';

/**
 * ChartEixos — Gráfico de barras horizontal dos eixos (órgãos) com total de obras e investimento.
 * Recebe `municipios` como props para filtrar por mesorregião/grupo.
 */

// Lista de órgãos/eixos conhecidos para ordem consistente
const EIXO_LABELS = {
  'POÇOS': 'Águas/Poços',
  'EDUCAÇÃO': 'Educação',
  'ESCOLA MILITAR - BOMBEIRO': 'Escola Militar/Bombeiro',
  'ESPORTE E LAZER': 'Esporte/Lazer',
  'DELEGACIAS': 'Delegacias',
  'SAÚDE': 'Saúde',
  'SEGURANÇA/PM': 'Segurança/PM',
  'PORTAL': 'Portal/I digital',
  'ESTAÇÃO TECH': 'Estação Tech',
  'PRAÇA': 'Praças/Pátios',
  'AGED': 'AGED',
  'IEMA': 'IEMA',
  'PATRIMÔNIO E INSTITUCIONAL': 'Patrimônio',
  'OUTROS': 'Outros'
};

function formatCurrency(val) {
  if (!val) return '—';
  if (val >= 1e6) return `R$ ${(val/1e6).toFixed(2)} mi`;
  if (val >= 1e3) return `R$ ${(val/1e3).toFixed(1)} mil`;
  return `R$ ${val.toFixed(0)}`;
}

function parseCurrency(val) {
  if (!val) return 0;
  const num = typeof val === 'string'
    ? parseFloat(val.replace(/[R$\s.]/g, '').replace(',', '.'))
    : Number(val);
  return isNaN(num) ? 0 : num;
}

/**
 * Extrai stats de eixos a partir da lista de municípios.
 * Cada município no JSON local deve ter uma chave `eixos` (array de objetos: {orgao, status, orcamento}).
 * Se não houver, retorna vazio.
 */
function getEixosStats(municipios = []) {
  const stats = {};
  municipios.forEach(mun => {
    const obras = mun?.eixos || [];
    if (!Array.isArray(obras)) return;
    obras.forEach(obra => {
      const orgao = obra.orgao || 'OUTROS';
      if (!stats[orgao]) {
        stats[orgao] = { total: 0, entregues: 0, andamento: 0, investimento: 0 };
      }
      stats[orgao].total += 1;
      stats[orgao].investimento += parseCurrency(obra.orcamento);

      const status = (obra.status || '').toUpperCase();
      if (status.includes('ENTREGUE') || status.includes('CONCLU')) {
        stats[orgao].entregues += 1;
      } else if (status.includes('EM ANDAMENTO')) {
        stats[orgao].andamento += 1;
      }
    });
  });
  return stats;
}

export function ChartEixos({ municipios }) {
  const colors = {
    textColor: '#7a8a99',
    gridColor: 'rgba(0,0,0,0.05)'
  };

  const stats = getEixosStats(municipios);

  const sorted = Object.entries(stats)
    .sort(([,a], [,b]) => b.investimento - a.investimento)
    .slice(0, 12);

  if (sorted.length === 0) {
    return (
      <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        <p style={{ fontSize: '12px', textAlign: 'center' }}>
          Nenhum dado de eixos disponível para os municípios filtrados.
        </p>
      </div>
    );
  }

  const labels = sorted.map(([orgao]) => EIXO_LABELS[orgao] || orgao);
  const obrasData = sorted.map(([,s]) => s.total);
  const investimentoData = sorted.map(([,s]) => s.investimento);

  const data = {
    labels,
    datasets: [
      {
        label: 'Total de Obras',
        data: obrasData,
        backgroundColor: '#3182bd',
        borderRadius: 4,
        borderWidth: 0
      },
      {
        label: 'Investimento (R$)',
        data: investimentoData,
        backgroundColor: '#27ae60',
        borderRadius: 4,
        borderWidth: 0
      }
    ]
  };

  return (
    <div style={{ height: '320px' }}>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { position: 'bottom', labels: { color: colors.textColor, font: { size: 10 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.parsed.x;
                  if (ctx.dataset.label === 'Investimento (R$)') return `Investimento: ${formatCurrency(val)}`;
                  return `${ctx.dataset.label}: ${val}`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: colors.textColor,
                maxTicksLimit: 6
              },
              grid: { color: colors.gridColor }
            },
            y: {
              ticks: { color: colors.textColor, font: { size: 10 } },
              grid: { display: false }
            }
          }
        }}
      />
    </div>
  );
}
