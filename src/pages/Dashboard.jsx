import { useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { MapaLeaflet } from '../components/MapaLeaflet';
import { KPICards } from '../components/KPICards';
import { TabelaMunicipios } from '../components/TabelaMunicipios';
import { ChartDistribuicaoGrupos, ChartLiderancas, ChartObrasStatus } from '../components/Charts';
import { formatCurrency } from '../data/municipios';

export function DashboardPage() {
  const { 
    municipios, 
    municipiosPrioritarios, 
    getMunicipiosFiltrados, 
    setMunicipioId,
    geoJSONData,
    initTema
  } = useStore();
  
  const municipiosFiltrados = getMunicipiosFiltrados();
  const isMunicipiosPage = false; // Dashboard shows all
  
  useEffect(() => {
    initTema();
    
    // Carrega GeoJSON
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
      <KPICards />
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            🗺️ Mapa do Maranhão <small style={{ fontSize: '11px', color: '#7a8a99', fontWeight: 400 }}>clique nos municípios</small>
          </h3>
          <MapaLeaflet 
            municipios={municipiosFiltrados}
            onMunicipioClick={handleMunicipioClick}
          />
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>Distribuição por Grupo</h3>
          <ChartDistribuicaoGrupos municipios={municipiosFiltrados} />
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>📊 Lideranças por Município</h3>
          <ChartLiderancas municipios={municipiosFiltrados} />
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>🏗️ Obras por Status</h3>
          <ChartObrasStatus municipios={municipiosFiltrados} />
        </div>
      </div>
    </div>
  );
}