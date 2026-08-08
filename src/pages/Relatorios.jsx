import { useStore } from '../hooks/useStore';
import { formatCurrency } from '../data/municipios';
import { Download, Printer } from 'lucide-react';

export function RelatoriosPage() {
  const { getMunicipiosFiltrados } = useStore();
  const municipiosFiltrados = getMunicipiosFiltrados();
  
  const exportarCSV = () => {
    const headers = ['Município', 'Grupo', 'População', 'Obras', 'Investimento', 'Lideranças'];
    const rows = municipiosFiltrados.map(m => [
      m.nome,
      m.grupoLabel || m.grupo,
      m.populacao_estimada || 0,
      m.total_obras || 0,
      formatCurrency(m.investimento_planner),
      m.total_liderancas || 0
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-municipios-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };
  
  const imprimirRelatorio = () => {
    window.print();
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
        <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>📄 Exportação de Relatórios</h3>
        <p style={{ fontSize: '13px', color: '#7a8a99', marginBottom: '16px' }}>
          Os relatórios respeitam o filtro de grupo e a busca ativa no momento da exportação.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <button onClick={exportarCSV} style={{ 
            padding: '10px 18px', border: 'none', background: '#0b3c5d', color: '#fff', 
            borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Download size={16} /> Exportar CSV
          </button>
          <button onClick={imprimirRelatorio} style={{ 
            padding: '10px 18px', border: 'none', background: '#1b9e5a', color: '#fff', 
            borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Printer size={16} /> Relatório PDF
          </button>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>Pré-visualização</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: '#f4f6f8', color: '#7a8a99', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Município</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Grupo</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>População</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Obras</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Investimento</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Lideranças</th>
                </tr>
              </thead>
              <tbody>
                {municipiosFiltrados.map(m => (
                  <tr key={m.ibge} style={{ borderBottom: '1px solid #dde3ea' }}>
                    <td style={{ padding: '8px 10px' }}>{m.nome}</td>
                    <td style={{ padding: '8px 10px' }}>{m.grupoLabel || m.grupo}</td>
                    <td style={{ padding: '8px 10px' }}>{m.populacao_estimada?.toLocaleString('pt-BR') || '—'}</td>
                    <td style={{ padding: '8px 10px' }}>{m.total_obras || 0}</td>
                    <td style={{ padding: '8px 10px' }}>{formatCurrency(m.investimento_planner)}</td>
                    <td style={{ padding: '8px 10px' }}>{m.total_liderancas || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}