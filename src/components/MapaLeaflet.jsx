import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CORES, LABELS, PRIORITY_IBGES } from '../data/municipios';
import { useStore } from '../hooks/useStore';

// Componente para controlar o mapa (fitBounds, etc.)
function MapController({ municipios, onMunicipioClick }) {
  const map = useMap();
  const { grupo, municipioId } = useStore();
  
  useEffect(() => {
    if (municipios.length > 0) {
      const group = map._layers ? map : null;
    }
  }, [municipios]);
  
  useEffect(() => {
    // Filtra visualmente pelo grupo
    map.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties) {
        const ibge = layer.feature.properties.CD_MUN;
        const mun = municipios.find(m => m.ibge === ibge);
        const munGrupo = mun?.grupo;
        
        let show = true;
        if (grupo !== 'todos') {
          show = munGrupo === grupo;
        }
        layer.setStyle({ opacity: show ? 1 : 0, fillOpacity: show ? 0.7 : 0 });
      }
    });
  }, [grupo, municipios]);
  
  useEffect(() => {
    // Destaca município selecionado
    if (municipioId) {
      map.eachLayer((layer) => {
        if (layer.feature && layer.feature.properties.CD_MUN === municipioId) {
          layer.setStyle({ weight: 5, color: '#fff', fillOpacity: 0.9 });
          layer.bringToFront();
          map.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 12 });
        }
      });
    }
  }, [municipioId, municipios]);
  
  return null;
}

// Estilo dos polígonos
function getStyle(feature, municipios) {
  const ibge = feature.properties.CD_MUN;
  const mun = municipios.find(m => m.ibge === ibge);
  const isPriority = PRIORITY_IBGES.has(ibge);
  const cor = mun?.cor || '#555';
  
  return {
    fillColor: cor,
    weight: isPriority ? 2.5 : 1,
    opacity: 1,
    color: 'rgba(0,0,0,0.25)',
    fillOpacity: isPriority ? 0.75 : 0.55
  };
}

// Highlight no hover
function highlightFeature(e) {
  const layer = e.target;
  layer.setStyle({
    weight: 3,
    color: '#fff',
    fillOpacity: 0.85
  });
  layer.bringToFront();
}

function resetHighlight(e, municipios) {
  const ibge = e.target.feature.properties.CD_MUN;
  const isPriority = PRIORITY_IBGES.has(ibge);
  const mun = municipios.find(m => m.ibge === ibge);
  const cor = mun?.cor || '#555';
  
  e.target.setStyle({
    fillColor: cor,
    weight: isPriority ? 2.5 : 1,
    color: 'rgba(0,0,0,0.25)',
    fillOpacity: isPriority ? 0.75 : 0.55
  });
}

// Popup/info no click
function onEachFeature(feature, layer, municipios, onMunicipioClick) {
  const ibge = feature.properties.CD_MUN;
  const nome = feature.properties.NM_MUN;
  const mun = municipios.find(m => m.ibge === ibge);
  
  layer.on({
    mouseover: highlightFeature,
    mouseout: (e) => resetHighlight(e, municipios),
    click: () => {
      if (onMunicipioClick) onMunicipioClick(ibge, nome);
    }
  });
  
  // Tooltip
  const grupoLabel = mun?.grupoLabel || 'Indefinido';
  layer.bindTooltip(`<strong>${nome}</strong><br>🎯 ${grupoLabel}`, {
    sticky: true,
    direction: 'top'
  });
}

// Legenda
function LegendControl({ municipios }) {
  const position = 'bottomright';
  const grupos = [
    { label: 'Orleans Brandão', cor: '#2980B9' },
    { label: 'Braide', cor: '#E67E22' },
    { label: 'Empate / Neutro', cor: '#F1C40F' },
    { label: 'Indefinido', cor: '#BDC3C7' }
  ];
  
  return (
    <div className="leaflet-control leaflet-control-custom" style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 1000, background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: '12px', lineHeight: '1.9', border: '1px solid #ddd' }}>
      <h4 style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '600', color: '#2980B9' }}>🎯 Grupo Político</h4>
      {grupos.map(g => (
        <div key={g.label} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
          <i style={{ background: g.cor, width: '14px', height: '14px', borderRadius: '2px', marginRight: '6px', float: 'left' }}></i>
          {g.label}
        </div>
      ))}
    </div>
  );
}

export function MapaLeaflet({ 
  municipios, 
  onMunicipioClick, 
  center = [-5.5, -45.5], 
  zoom = 6,
  height = '560px',
  id = 'map'
}) {
  const { geoJSONData, setMapInstance } = useStore();
  
  // Salva referência do mapa
  useEffect(() => {
    // O MapContainer expõe o mapa via useMap no MapController
  }, []);
  
  if (!geoJSONData) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8', borderRadius: '10px', border: '1px solid #ddd' }}>
        <div style={{ textAlign: 'center', color: '#7a8a99' }}>
          <div style={{ fontSize: '2.5rem' }}>🗺️</div>
          <div style={{ fontWeight: 600 }}>Carregando mapa...</div>
        </div>
      </div>
    );
  }
  
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      minZoom={5}
      maxZoom={13}
      scrollWheelZoom={true}
      style={{ height, width: '100%', borderRadius: '10px', border: '1px solid #ddd' }}
      whenCreated={setMapInstance}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
        crossOrigin={true}
      />
      <GeoJSON
        data={geoJSONData}
        style={(feature) => getStyle(feature, municipios)}
        onEachFeature={(feature, layer) => onEachFeature(feature, layer, municipios, onMunicipioClick)}
      />
      <MapController municipios={municipios} onMunicipioClick={onMunicipioClick} />
      <LegendControl municipios={municipios} />
    </MapContainer>
  );
}

// Mapa grande para a página "Mapa Político"
export function MapaGrandeLeaflet({ municipios, onMunicipioClick }) {
  return (
    <MapaLeaflet
      municipios={municipios}
      onMunicipioClick={onMunicipioClick}
      height="600px"
      id="mapGrande"
    />
  );
}