import { useStore } from '../hooks/useStore';
import { Search, Filter } from 'lucide-react';

export function FiltrosGlobais() {
  const { grupo, setGrupo, busca, setBusca, modo } = useStore();
  
  const grupos = [
    { value: 'todos', label: 'Todos' },
    { value: 'Brandão', label: '🔵 Orleans' },
    { value: 'Braide', label: '🟠 Braide' },
    { value: 'neutro', label: '🟡 Neutro' },
    { value: 'indefinido', label: '⚪ Indefinido' }
  ];
  
  return (
    <div style={{ 
      display: 'flex', 
      gap: '10px', 
      flexWrap: 'wrap', 
      alignItems: 'center', 
      marginBottom: '16px',
      padding: '0 24px'
    }}>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#7a8a99' }}>🎯 GRUPO:</span>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {grupos.map(g => (
          <button
            key={g.value}
            onClick={() => setGrupo(g.value)}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: '1px solid #dde3ea',
              background: grupo === g.value ? '#0b3c5d' : '#fff',
              color: grupo === g.value ? '#fff' : '#22313f',
              fontSize: '12.5px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {g.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <input
          type="text"
          id="busca"
          placeholder="🔍 Buscar município..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '300px',
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