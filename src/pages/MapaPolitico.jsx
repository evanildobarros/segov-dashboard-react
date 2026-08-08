import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { MapaLeaflet } from '../components/MapaLeaflet';
import { Button } from '../components/ui/Button';

export function MapaPoliticoPage() {
  const { 
    municipios, 
    getMunicipiosFiltrados, 
    setMunicipioId,
    geoJSONData,
    initTema
  } = useStore();
  
  const [modoMapa, setModoMapa] = useState('grupo'); // 'grupo' | 'obras'
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
  
  const handleMunicipioClick = (ibge, nome) => {
    setMunicipioId(ibge);
  };
  
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
        <h3 style={{ 
          fontSize: '14px', color: '#0b3c5d', marginBottom: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          🗺️ Mapa Coroplético Interativo
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant={modoMapa === 'grupo' ? 'primary' : 'secondary'} onClick={() => setModoMapa('grupo')}>
              Colorir por Grupo
            </Button>
            <Button variant={modoMapa === 'obras' ? 'primary' : 'secondary'} onClick={() => setModoMapa('obras')}>
              Colorir por Obras
            </Button>
          </div>
        </h3>
        <MapaLeaflet 
          municipios={municipiosFiltrados}
          onMunicipioClick={handleMunicipioClick}
          height="600px"
          id="mapGrande"
        />
      </div>
    </div>
  );
}