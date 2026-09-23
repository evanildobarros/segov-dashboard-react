import { useStore } from '../hooks/useStore';
import { formatCurrency, LABELS } from '../data/municipios';
import { Download, Printer } from 'lucide-react';

export function RelatoriosPage() {
  const { getMunicipiosFiltrados } = useStore();
  const municipiosFiltrados = getMunicipiosFiltrados();
  
  const exportarCSV = () => {
    const headers = ['Município', 'Grupo', 'População', 'Obras', 'Investimento', 'Lideranças'];
    const rows = municipiosFiltrados.map(m => [
      m.nome,
      LABELS[m.grupo] || m.grupo,
      m.populacao_estimada ?? 'Não informado',
      m.total_obras || 0,
      formatCurrency(m.investimento_planner),
      m.total_liderancas || 0
    ]);
    const escape = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
    const csv = '\uFEFF' + [headers, ...rows].map(row => row.map(escape).join(';')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-municipios-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  
  const imprimirRelatorio = () => {
    window.print();
  };
  
  return (
    <div style={{ paddingTop: '8px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '16px 18px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--heading)', marginBottom: '12px' }}>📄 Exportação de Relatórios</h3>
        <p style={{ fontSize: '13px', color: 'var(--texto-secundario)', marginBottom: '16px' }}>
          Exportação dos municípios selecionados pelos filtros acima. Use a impressão do navegador para salvar em PDF.
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
            <Printer size={16} /> Imprimir / salvar PDF
          </button>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--heading)', marginBottom: '12px' }}>Pré-visualização</h3>
          <div className="report-table" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'var(--surface-muted)', color: 'var(--texto-secundario)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid var(--borda)' }}>Município</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid var(--borda)' }}>Grupo</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid var(--borda)' }}>População</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid var(--borda)' }}>Obras</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid var(--borda)' }}>Investimento</th>
                  <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid var(--borda)' }}>Lideranças</th>
                </tr>
              </thead>
              <tbody>
                {municipiosFiltrados.map(m => (
                  <tr key={m.ibge} style={{ borderBottom: '1px solid var(--borda)' }}>
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