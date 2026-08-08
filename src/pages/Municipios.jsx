import { useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { TabelaMunicipios } from '../components/TabelaMunicipios';

export function MunicipiosPage() {
  const { 
    getMunicipiosFiltrados, 
    setMunicipioId,
    geoJSONData,
    initTema
  } = useStore();
  
  const municipiosFiltrados = getMunicipiosFiltrados();
  
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
    <div style={{ padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
        <h3 style={{ 
          fontSize: '14px', color: '#0b3c5d', marginBottom: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          📋 Lista de Municípios
          <small id="contadorTabela" style={{ fontSize: '11px', color: '#7a8a99' }}>
            {municipiosFiltrados.length} registro(s)
          </small>
        </h3>
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <TabelaMunicipios 
            municipios={municipiosFiltrados}
            onRowClick={handleRowClick}
          />
        </div>
      </div>
    </div>
  );
}