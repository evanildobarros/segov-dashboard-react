import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import projecaoData from '../data/projecao_eleicoes_2026.json';

const COLORS = {
  'Orleans': '#3b82f6', // Blue
  'Braide': '#f97316',  // Orange
  'Indefinido': '#94a3b8' // Gray
};

const Projecao2026 = () => {
  const { state_metrics, municipalities } = projecaoData;

  const trendData = state_metrics.trend;
  const currentBraide = state_metrics.braide_current_pct;
  const currentApproval = state_metrics.gov_approval_pct;

  return (
    <div className="projection-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '10px' }}>📈 Projeção Eleitoral 2026</h1>

      {/* KPI Section: Gauge-like Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '15px' }}>Intenção de Voto (Braide)</h3>
          <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--primary-color)' }}>{currentBraide}%</div>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>Cenário Estimulado (Set/2026)</p>
        </div>
        <div className="card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '15px' }}>Aprovação Governo Brandão</h3>
          <div style={{ fontSize: '48px', fontWeight: '800', color: 'var(--success-color)' }}>{currentApproval}%</div>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>Aprovação Geral (Set/2026)</p>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', height: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>📈 Evolução da Intenção de Voto</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 60]} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} name="Eduardo Braide (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Political Heatmap (Simplified implementation using circles for 217 cities) */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', height: '600px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>🗺️ Mapa de Apoio Municipal (217 Cidades)</h3>
        <div style={{ height: '500px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <MapContainer center={[-4.2, -44.3]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {municipalities.map((m, idx) => {
              // Placeholder coords if not present in base
              const lat = m.lat || -4.2 + (Math.random() - 0.5) * 5;
              const lng = m.lng || -44.3 + (Math.random() - 0.5) * 6;
              const support = m['Apoio a Orleans'] === 'Sim' ? 'Orleans' : (m['Apoio a Braide'] === 'Sim' ? 'Braide' : 'Indefinido');
              
              return (
                <CircleMarker key={idx} center={[lat, lng]} radius={5} pathOptions={{ color: COLORS[support] }}>
                  <LeafletTooltip direction="top" offset={[0, -10]} opacity={1}>
                    <strong>{m.Município}</strong><br/>Apoio: {support}
                  </LeafletTooltip>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Projecao2026;
