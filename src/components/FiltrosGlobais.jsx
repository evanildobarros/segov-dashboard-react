import { useStore } from '../hooks/useStore';
import { Search, Filter } from 'lucide-react';

// Lista de mesorregiões do Maranhão (oficial IBGE)
const MESORREgIOES = [
  { value: 'todas', label: 'Todas' },
  { value: 'Centro Maranhense', label: '🟦 Centro' },
  { value: 'Leste Maranhense', label: '🟧 Leste' },
  { value: 'Norte Maranhense', label: '🟩 Norte' },
  { value: 'Oeste Maranhense', label: '🟥 Oeste' },
  { value: 'Sul Maranhense', label: '🟪 Sul' },
];

export function FiltrosGlobais() {
  const { grupo, setGrupo, busca, setBusca, mesorregiao, setMesorregiao } = useStore();

  const grupos = [
    { value: 'todos', label: 'Todos' },
    { value: 'Brandão', label: '🔵 Orleans' },
    { value: 'Braide', label: '🟠 Braide' },
    { value: 'neutro', label: '🟡 Neutro' },
    { value: 'indefinido', label: '⚪ Indefinido' }
  ];

  return (
    <div className="filtros-globais-bar">
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#7a8a99', whiteSpace: 'nowrap' }}>🎯 GRUPO:</span>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {grupos.map(g => (
          <button
            key={g.value}
            onClick={() => setGrupo(g.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid #dde3ea',
              background: grupo === g.value ? '#0b3c5d' : '#fff',
              color: grupo === g.value ? '#fff' : '#22313f',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      <span style={{ fontSize: '12px', fontWeight: 700, color: '#7a8a99', whiteSpace: 'nowrap' }}>🗺️ MESORREGIÃO:</span>
      <select
        value={mesorregiao || 'todas'}
        onChange={(e) => setMesorregiao(e.target.value)}
        style={{
          padding: '6px 10px',
          borderRadius: '20px',
          border: '1px solid #dde3ea',
          background: '#fff',
          color: '#22313f',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {MESORREgIOES.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <div className="filtros-busca-wrapper">
        <input
          type="text"
          id="busca"
          placeholder="🔍 Buscar município..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '320px',
            padding: '8px 12px',
            border: '1px solid #dde3ea',
            borderRadius: '7px',
            fontSize: '13px',
            background: '#fff',
            color: '#22313f'
          }}
        />
      </div>
    </div>
  );
}
