import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const MunicipiosPage = () => {
  const { filtrados, municipios, loading } = useData();
  const [view, setView] = useState('prioritarios'); // 'todos' ou 'prioritarios'

  if (loading) return <div className="loading">Carregando lista...</div>;

  const listaExibicao = view === 'prioritarios' 
    ? filtrados.filter(m => m.prioritario) 
    : filtrados;

  return (
    <div className="page-municipios">
      <div className="card">
        <h3>📋 Lista de Municípios 
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: '15px' }}>
            <small id="contadorTabela">Exibindo {listaExibicao.length} registros</small>
            <button 
              className={`btn small ${view === 'prioritarios' ? 'primary' : ''}`} 
              onClick={() => setView('prioritarios')}
            >Prioritários</button>
            <button 
              className={`btn small ${view === 'todos' ? 'primary' : ''}`} 
              onClick={() => setView('todos')}
            >Todos (217)</button>
          </div>
        </h3>
        <div className="scroll-table">
          <table>
            <thead>
              <tr>
                <th>Município</th>
                <th>Grupo</th>
                <th>Prefeito</th>
                <th>Partido</th>
                <th>Lideranças</th>
                <th>Investimento</th>
              </tr>
            </thead>
            <tbody>
              {listaExibicao.map(m => (
                <tr key={m.ibge}>
                  <td>
                    <span style={{ fontWeight: '600' }}>{m.nome}</span>
                    {m.prioritario && <span className="badge" style={{ marginLeft: '5px', backgroundColor: 'var(--azul)' }}>PRIO</span>}
                  </td>
                  <td><span className={`badge`} style={{ backgroundColor: m.grupo === 'Brandão' ? '#2980B9' : m.grupo === 'Braide' ? '#E67E22' : m.grupo === 'neutro' ? '#F1C40F' : '#BDC3C7' }}>{m.grupo}</span></td>
                  <td>{m.prefeito || '-'}</td>
                  <td>{m.partido || '-'}</td>
                  <td>{m.total_liderancas || 0}</td>
                  <td>{m.investimento_planner || m.investimento || '-'}</td>
                </tr>
              ))}
              {listaExibicao.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                    Nenhum município encontrado para os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MunicipiosPage;
