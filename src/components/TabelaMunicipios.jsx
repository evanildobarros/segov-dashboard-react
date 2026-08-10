import { useStore } from '../hooks/useStore';
import { formatCurrency, CORES, LABELS } from '../data/municipios';

const COLUNAS = [
  { key: 'nome', label: 'Município', render: (m) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ 
        width: '10px', height: '10px', borderRadius: '50%', 
        background: CORES[m.grupo] || '#555',
        flexShrink: 0
      }}></span>
      <span>{m.nome} {m.isPriority && '⭐'}</span>
    </span>
  )},
  { key: 'grupo', label: 'Grupo', render: (m) => (
    <span style={{
      padding: '3px 10px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 700,
      color: '#fff',
      background: CORES[m.grupo] || '#555',
      display: 'inline-block'
    }}>
      {LABELS[m.grupo] || m.grupo}
    </span>
  )},
  { key: 'prefeito', label: 'Prefeito', render: (m) => m.prefeito || '—' },
  { key: 'partido', label: 'Partido', render: (m) => m.partido || '—' },
  { key: 'total_liderancas', label: 'Lideranças', render: (m) => m.total_liderancas > 0 ? m.total_liderancas : '—' },
  { key: 'investimento', label: 'Investimento', render: (m) => formatCurrency(m.investimento_planner) }
];

export function TabelaMunicipios({ municipios, onRowClick }) {
  return (
    <div className="table-container">
      <table className="responsive-table">
        <thead>
          <tr style={{ background: '#f4f6f8', color: '#7a8a99', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            {COLUNAS.map((col, i) => (
              <th key={col.key} className={i === 0 ? 'sticky-col' : ''} style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody id="tabela-body">
          {municipios.length === 0 ? (
            <tr>
              <td colSpan={COLUNAS.length} style={{ textAlign: 'center', padding: '20px', color: '#7a8a99' }}>
                Nenhum município encontrado.
              </td>
            </tr>
          ) : (
            municipios.map((m, i) => (
              <tr 
                key={m.ibge}
                onClick={() => onRowClick?.(m)}
                style={{ 
                  cursor: onRowClick ? 'pointer' : 'default',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)',
                  borderBottom: '1px solid #dde3ea'
                }}
              >
                {COLUNAS.map((col, colIdx) => (
                  <td key={col.key} className={colIdx === 0 ? 'sticky-col' : ''} style={{ padding: '8px 10px', borderBottom: '1px solid #dde3ea', verticalAlign: 'middle' }}>
                    {col.render(m)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}