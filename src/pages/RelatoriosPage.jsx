import React from 'react';
import { useData } from '../context/DataContext';

const RelatoriosPage = () => {
  const { filtrados } = useData();

  const exportarCSV = () => {
    const headers = ['Município,Grupo,Prefeito,Partido,Lideranças,Investimento,Obras\n'];
    const rows = filtrados.map(m => 
      `${m.nome},${m.grupo},${m.prefeito || '-'},${m.partido || '-'},${m.total_liderancas || 0},${m.investimento || '-'},${m.total_obras || 0}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_segov.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="page-relatorios">
      <div className="card">
        <h3>📄 Exportação de Relatórios
          <small style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '10px' }}>
            Os relatórios respeitam os filtros ativos.
          </small>
        </h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button className="btn primary" onClick={exportarCSV}>⬇️ Exportar CSV</button>
          <button className="btn green" onClick={imprimir}>🖨️ Imprimir PDF</button>
        </div>
        
        <h4>Pré-visualização dos Dados</h4>
        <div className="scroll-table">
          <table>
            <thead>
              <tr>
                <th>Município</th>
                <th>Grupo</th>
                <th>População/Lideranças</th>
                <th>Obras</th>
                <th>Investimento</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(m => (
                <tr key={m.ibge}>
                  <td>{m.nome}</td>
                  <td>{m.grupo}</td>
                  <td>{m.total_liderancas || 0}</td>
                  <td>{m.total_obras || 0}</td>
                  <td>{m.investimento || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosPage;
