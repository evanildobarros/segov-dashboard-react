import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useData } from '../context/DataContext';
import { carregarGeoJSON, CORES } from '../data/dados';

// Componente para centralizar o mapa e atualizar o zoom quando os dados mudarem
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const MapPage = () => {
  const { municipios, filtrados } = useData();
  const [geojsonData, setGeojsonData] = useState(null);
  const [modoMapa, setModoMapa] = useState('grupo'); // 'grupo' ou 'obras'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMapData() {
      try {
        const data = await carregarGeoJSON();
        setGeojsonData(data);
      } catch (e) {
        console.error("Erro ao carregar GeoJSON:", e);
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, []);

  const getCor = (m) => {
    if (!m) return '#BDC3C7';
    if (modoMapa === 'obras') {
      return m.total_obras > 20 ? '#2ecc71' : m.total_obras > 0 ? '#f1c40f' : '#ecf0f1';
    }
    return CORES[m.grupo] || '#BDC3C7';
  };

  const onEachFeature = (feature, layer) => {
    const ibge = feature.properties.CD_MUN;
    const m = municipios.find(mun => mun.ibge === ibge);
    
    if (m) {
      layer.bindPopup(`
        <strong>${m.nome}</strong><br/>
        Grupo: ${m.grupo || 'Indefinido'}<br/>
        Prefeito: ${m.prefeito || '-'}<br/>
        Obras: ${m.total_obras || 0}
      `);
    }
  };

  const style = (feature) => {
    const ibge = feature.properties.CD_MUN;
    const m = municipios.find(mun => mun.ibge === ibge);
    const isPrioritario = m && m.prioritario;

    return {
      fillColor: getCor(m),
      weight: isPrioritario ? 2 : 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  };

  if (loading) return <div className="loading">Carregando mapa...</div>;

  return (
    <div className="page-mapa">
      <div className="card">
        <h3>🗺️ Mapa Coroplético Interativo
          <small style={{ marginLeft: '15px' }}>
            <button 
              className={`btn small ${modoMapa === 'grupo' ? 'primary' : ''}`} 
              onClick={() => setModoMapa('grupo')}
            >Colorir por Grupo</button>
            <button 
              className={`btn small ${modoMapa === 'obras' ? 'primary' : ''}`} 
              onClick={() => setModoMapa('obras')}
            >Colorir por Obras</button>
          </small>
        </h3>
        <div id="mapGrande" style={{ height: '600px', width: '100%', borderRadius: '10px' }}>
          <MapContainer center={[-5.0, -45.3]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {geojsonData && (
              <GeoJSON 
                data={geojsonData} 
                style={style} 
                onEachFeature={onEachFeature} 
              />
            )}
            <MapController center={[-5.0, -45.3]} zoom={6} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
