import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { TabelaMunicipios } from '../components/TabelaMunicipios';
import { PRIORITY_IBGES } from '../data/municipios';

export function MunicipiosPage() {
  const { 
    getMunicipiosFiltrados, 
    setMunicipioId,
    geoJSONData,
    initTema,
    municipios,
    setGrupo
  } = useStore();
  const [view, setView] = useState('todos'); // Default: Todos (217) para melhor UX
  
  // Reset filtro ao montar a página
  useEffect(() => {
    setGrupo('todos');
  }, [setGrupo]);
  
  const municipiosFiltrados = getMunicipiosFiltrados();
  
  // Quando view === 'todos', ignora o filtro do modo e usa todos os 217
  const listaExibicao = view === 'prioritarios' 
    ? municipiosFiltrados 
    : municipios.filter(m => {
        const { grupo, busca } = useStore.getState();
        let match = true;
        if (grupo && grupo !== 'todos') {
          match = match && (m.grupo === grupo);
        }
        if (busca) {
          const q = busca.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
          match = match && (
            (m.nome || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').includes(q) ||
            (m.prefeito || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').includes(q)
          );
        }
        return match;
      });

  useEffect(() => {
    initTema();
    
    if (!geoJSONData) {
      fetch('/ma_municipios.min.geojson')
        .then(r => r.json())
        .then(data => useStore.getState().setGeoJSONData(data))
        .catch(console.error);
    }
  }, [geoJSONData, initTema]);
  
  const handleRowClick = (municipio) => {
    setMunicipioId(municipio.ibge);
  };

  return (
    <div style={{ paddingTop: '8px' }}>
      <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
        <h3 style={{ 
          fontSize: '14px', color: '#0b3c5d', marginBottom: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
        }}>
          📋 Lista de Municípios
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <small id="contadorTabela" style={{ fontSize: '11px', color: '#7a8a99' }}>
              {listaExibicao.length} registro(s)
            </small>
            <button 
              className={`btn small ${view === 'prioritarios' ? 'primary' : ''}`}
              onClick={() => setView('prioritarios')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #dde3ea',
                background: view === 'prioritarios' ? '#0b3c5d' : '#fff',
                color: view === 'prioritarios' ? '#fff' : '#22313f',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Prioritários (8)
            </button>
            <button 
              className={`btn small ${view === 'todos' ? 'primary' : ''}`}
              onClick={() => setView('todos')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #dde3ea',
                background: view === 'todos' ? '#0b3c5d' : '#fff',
                color: view === 'todos' ? '#fff' : '#22313f',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Todos (217)
            </button>
          </div>
        </h3>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <TabelaMunicipios 
            municipios={listaExibicao}
            onRowClick={handleRowClick}
          />
        </div>
      </div>
    </div>
  );
}