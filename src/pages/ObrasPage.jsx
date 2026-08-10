import React from 'react';
import { useData } from '../context/DataContext';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const ObrasPage = () => {
  const { filtrados, loading } = useData();

  if (loading) return <div className="loading">Carregando dados de obras...</div>;

  // Cálculos de Status de Obras
  const statusData = {
    emAndamento: filtrados.reduce((s, m) => s + (m.obras_em_andamento || 0), 0),
    entregues: filtrados.reduce((s, m) => s + (m.obras_entregues || 0), 0),
    planejadas: filtrados.reduce((s, m) => s + (m.total_obras || 0) - (m.obras_em_andamento || 0) - (m.obras_entregues || 0), 0),
  };

  const pieData = {
    labels: ['Em Andamento', 'Entregues', 'Planejadas'],
    datasets: [{
      data: [statusData.emAndamento, statusData.entregues, statusData.planejadas],
      backgroundColor: ['#f1c40f', '#2ecc71', '#3498db'],
    }]
  };

  // Top 10 Investimentos
  const topInvest = [...filtrados]
    .sort((a, b) => (b.investimento || 0) - (a.investimento || 0))
    .slice(0, 10);

  const barData = {
    labels: topInvest.map(m => m.nome),
    datasets: [{
      label: 'Investimento (R$)',
      data: topInvest.map(m => m.investimento || 0),
      backgroundColor: '#2980B9',
    }]
  };

  return (
    <div className="page-obras">
      <div className="grid2">
        <div className="card">
          <h3>🏗️ Situação Global das Obras</h3>
          <div style={{ maxHeight: '300px', display: 'flex', justifyContent: 'center' }}>
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <div className="legenda" style={{ marginTop: '20px' }}>
            Total de Obras: <b>{filtrados.reduce((s, m) => s + (m.total_obras || 0), 0)}</b>
          </div>
        </div>
        <div className="card">
          <h3>💰 Top 10 Investimentos</h3>
          <Bar data={barData} options={{ responsive: true }} />
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3>📋 Detalhamento por Município</h3>
        <div className="scroll-table">
          <table>
            <thead>
              <tr>
                <th>Município</th>
                <th>Total Obras</th>
                <th>Em Andamento</th>
                <th>Entregues</th>
                <th>Investimento</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(m => (
                <tr key={m.ibge}>
                  <td>{m.nome}</td>
                  <td>{m.total_obras || 0}</td>
                  <td>{m.obras_em_andamento || 0}</td>
                  <td>{m.obras_entregues || 0}</td>
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

export default ObrasPage;
