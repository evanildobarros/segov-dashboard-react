import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useMunicipiosFiltrados } from '../hooks/useStore';
import { TabelaMunicipios } from '../components/TabelaMunicipios';
export function MunicipiosPage() {
  const [view, setView] = useState('todos');
  const filtrados = useMunicipiosFiltrados();
  const setMunicipioId = useStore(s => s.setMunicipioId);
  const navigate = useNavigate();
  const listaExibicao = view === 'todos' ? filtrados : filtrados.filter(m => m.prioritario);
  const contagemPrioritarios = filtrados.filter(m => m.prioritario).length;
  const handleRowClick = municipio => { setMunicipioId(municipio.ibge); navigate('/mapa'); };
  return (
    <div style={{ paddingTop: '8px' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px', padding: '16px 18px' }}>
        <h3 style={{ 
          fontSize: '14px', color: 'var(--heading)', marginBottom: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
        }}>
          📋 Lista de Municípios
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <small id="contadorTabela" style={{ fontSize: '11px', color: 'var(--texto-secundario)' }}>
              {listaExibicao.length} registro(s)
            </small>
            <button 
              onClick={() => setView('prioritarios')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--borda)',
                background: view === 'prioritarios' ? '#0b3c5d' : 'var(--bg-card)',
                color: view === 'prioritarios' ? '#fff' : 'var(--texto)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Prioritários ({contagemPrioritarios})
            </button>
            <button 
              onClick={() => setView('todos')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--borda)',
                background: view === 'todos' ? '#0b3c5d' : 'var(--bg-card)',
                color: view === 'todos' ? '#fff' : 'var(--texto)',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Todos ({filtrados.length})
            </button>
          </div>
        </h3>
        <div className="municipality-table-wrap">
          <TabelaMunicipios 
            municipios={listaExibicao}
            onRowClick={handleRowClick}
          />
        </div>
      </div>
    </div>
  );
}