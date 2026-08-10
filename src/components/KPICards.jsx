import { useKPIs } from '../hooks/useStore';
import { formatCurrency } from '../data/municipios';

export function KPICards() {
  const kpis = useKPIs();
  
  const cards = [
    { 
      label: 'Municípios', 
      value: kpis.total, 
      sublabel: `${kpis.total} município(s) do Maranhão`,
      color: '#0b3c5d',
      icon: '🏛️'
    },
    { 
      label: 'Base Governista', 
      value: kpis.orleans, 
      sublabel: `${kpis.orleans} municípios (${kpis.total ? Math.round(kpis.orleans/kpis.total*100) : 0}%)`,
      color: '#1b9e5a',
      icon: '🔵'
    },
    { 
      label: 'Oposição Braide', 
      value: kpis.braide, 
      sublabel: `${kpis.braide} municípios`,
      color: '#E67E22',
      icon: '🟠'
    },
    { 
      label: 'Obras Registradas', 
      value: kpis.totalObras, 
      sublabel: 'total no PLANNER SEGOV',
      color: '#e8b923',
      icon: '🏗️'
    },
    { 
      label: 'Lideranças', 
      value: kpis.totalLiderancas, 
      sublabel: 'total cadastradas',
      color: '#7d5ba6',
      icon: '👥'
    },
    { 
      label: 'Investimento', 
      value: formatCurrency(kpis.totalInvestimento), 
      sublabel: 'acumulado',
      color: '#c0392b',
      icon: '💰'
    }
  ];
  
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
      gap: '14px', 
      marginBottom: '20px' 
    }}>
      {cards.map((card, i) => (
        <div key={i} style={{
          background: '#fff',
          border: '1px solid #dde3ea',
          borderRadius: '10px',
          padding: '16px 18px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: card.color,
            borderRadius: '3px'
          }}></div>
          <div style={{ 
            fontSize: '11.5px', 
            color: '#7a8a99', 
            fontWeight: 600, 
            textTransform: 'uppercase', 
            letterSpacing: '0.4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>{card.icon}</span>
            {card.label}
          </div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: card.color, marginTop: '4px' }}>
            {card.value}
          </div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', marginTop: '2px' }}>
            {card.sublabel}
          </div>
        </div>
      ))}
    </div>
  );
}