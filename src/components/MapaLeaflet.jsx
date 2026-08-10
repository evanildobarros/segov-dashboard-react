import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CORES, LABELS, PRIORITY_IBGES, formatCurrency } from '../data/municipios';
import { useStore } from '../hooks/useStore';

// Corrigir ícones padrão do Leaflet no bundler Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
});

// Provedores de mapas base (Tile Layers)
const TILE_LAYERS = {
  carto: {
    name: '🎨 Mapa Claro (CARTO)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
  },
  osm: {
    name: '🗺️ OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    name: '🛰️ Satélite (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  }
};

// Helper para parse de investimento
function parseInvestimento(val) {
  if (!val) return 0;
  const num = typeof val === 'string'
    ? parseFloat(val.replace(/[R$\s.]/g, '').replace(',', '.'))
    : Number(val);
  return isNaN(num) ? 0 : num;
}

// Estilo dos polígonos conforme modoMapa
function getStyle(feature, municipios, modoMapa = 'grupo') {
  const ibge = feature.properties.CD_MUN;
  const mun = municipios.find(m => m.ibge === ibge);
  const isPriority = PRIORITY_IBGES.has(ibge);

  let cor = '#BDC3C7';
  let opacity = 0.65;
  let weight = 1;
  let strokeColor = 'rgba(0,0,0,0.3)';

  if (modoMapa === 'grupo') {
    cor = mun?.cor || '#BDC3C7';
    opacity = isPriority ? 0.85 : 0.65;
    weight = isPriority ? 2.5 : 1;
    if (isPriority) strokeColor = '#0b3c5d';
  } else if (modoMapa === 'obras') {
    const totalObras = mun?.total_obras || 0;
    if (totalObras === 0) cor = '#e2e8f0';
    else if (totalObras <= 2) cor = '#9ecae1';
    else if (totalObras <= 5) cor = '#3182bd';
    else cor = '#08519c';
    opacity = 0.75;
  } else if (modoMapa === 'investimento') {
    const val = parseInvestimento(mun?.investimento_planner);
    if (val === 0) cor = '#f1f5f9';
    else if (val <= 500000) cor = '#fcae91';
    else if (val <= 2000000) cor = '#fb6a4a';
    else cor = '#cb181d';
    opacity = 0.8;
  } else if (modoMapa === 'prioritarios') {
    if (isPriority) {
      cor = '#e8b923';
      opacity = 0.9;
      weight = 3;
      strokeColor = '#0b3c5d';
    } else {
      cor = '#cbd5e1';
      opacity = 0.35;
    }
  }

  return {
    fillColor: cor,
    weight,
    opacity: 1,
    color: strokeColor,
    fillOpacity: opacity
  };
}

// Auto-fit bounds de Maranhão na carga inicial
function AutoFitMaranhao({ geoJSONData }) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (geoJSONData && map && !fittedRef.current) {
      try {
        const geoLayer = L.geoJSON(geoJSONData);
        const bounds = geoLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
          fittedRef.current = true;
        }
      } catch (e) {
        console.error('Erro ao ajustar limites do Maranhão:', e);
      }
    }
  }, [geoJSONData, map]);

  return null;
}

// Controla fitBounds e destaques no mapa
function MapController({ municipios, modoMapa, onMunicipioClick }) {
  const map = useMap();
  const { municipioId } = useStore();

  useEffect(() => {
    if (municipioId) {
      map.eachLayer((layer) => {
        if (layer.feature && layer.feature.properties && layer.feature.properties.CD_MUN === municipioId) {
          layer.setStyle({ weight: 4, color: '#0b3c5d', fillOpacity: 0.95 });
          layer.bringToFront();
          try {
            map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 11 });
          } catch (e) {
            // ignore bounds error if invalid
          }
        }
      });
    }
  }, [municipioId, municipios, map]);

  return null;
}

// Configura interações de cada polígono
function setupFeature(feature, layer, municipios, modoMapa, onMunicipioClick) {
  const ibge = feature.properties.CD_MUN;
  const nome = feature.properties.NM_MUN;
  const mun = municipios.find(m => m.ibge === ibge);

  layer.on({
    mouseover: (e) => {
      const l = e.target;
      l.setStyle({ weight: 3, color: '#ffffff', fillOpacity: 0.95 });
      l.bringToFront();
    },
    mouseout: (e) => {
      const defaultStyle = getStyle(feature, municipios, modoMapa);
      e.target.setStyle(defaultStyle);
    },
    click: () => {
      if (onMunicipioClick) onMunicipioClick(ibge, nome);
    }
  });

  // Tooltip customizado por modo
  let infoExtra = '';
  if (modoMapa === 'grupo') {
    infoExtra = `🎯 ${mun?.grupoLabel || 'Indefinido'}`;
  } else if (modoMapa === 'obras') {
    infoExtra = `🏗️ ${mun?.total_obras || 0} obra(s)`;
  } else if (modoMapa === 'investimento') {
    infoExtra = `💰 ${formatCurrency(mun?.investimento_planner)}`;
  } else if (modoMapa === 'prioritarios') {
    infoExtra = mun?.isPriority ? '⭐ Município Prioritário' : 'Município Regular';
  }

  layer.bindTooltip(`
    <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
      <strong style="color: #0b3c5d; font-size: 13px;">${nome}</strong><br/>
      <span style="font-size: 11px; color: #475569;">IBGE ${ibge}</span><br/>
      <span style="margin-top: 4px; display: inline-block;">${infoExtra}</span>
      ${mun?.prefeito ? `<br/><small style="color: #64748b;">Prefeito: ${mun.prefeito}</small>` : ''}
    </div>
  `, {
    sticky: true,
    direction: 'top'
  });
}

// Legenda dinâmica por modo
function LegendControl({ municipios, modoMapa }) {
  let titulo = '🎯 Grupo Político';
  let itens = [];

  if (modoMapa === 'grupo') {
    const counts = {
      'Brandão': municipios.filter(m => m.grupo === 'Brandão').length,
      'Braide': municipios.filter(m => m.grupo === 'Braide').length,
      'neutro': municipios.filter(m => m.grupo === 'neutro').length,
      'indefinido': municipios.filter(m => m.grupo === 'indefinido').length,
    };
    titulo = '🎯 Alinhamento Político';
    itens = [
      { label: `Orleans Brandão (${counts['Brandão']})`, cor: '#2980B9' },
      { label: `Braide (${counts['Braide']})`, cor: '#E67E22' },
      { label: `Empate / Neutro (${counts['neutro']})`, cor: '#F1C40F' },
      { label: `Indefinido (${counts['indefinido']})`, cor: '#BDC3C7' }
    ];
  } else if (modoMapa === 'obras') {
    titulo = '🏗️ Volume de Obras';
    itens = [
      { label: 'Sem Obras Registradas', cor: '#e2e8f0' },
      { label: '1 a 2 Obras', cor: '#9ecae1' },
      { label: '3 a 5 Obras', cor: '#3182bd' },
      { label: '6+ Obras', cor: '#08519c' }
    ];
  } else if (modoMapa === 'investimento') {
    titulo = '💰 Investimento Planejado';
    itens = [
      { label: 'Sem registro', cor: '#f1f5f9' },
      { label: 'Até R$ 500 mil', cor: '#fcae91' },
      { label: 'R$ 500k a R$ 2 mi', cor: '#fb6a4a' },
      { label: 'Acima de R$ 2 mi', cor: '#cb181d' }
    ];
  } else if (modoMapa === 'prioritarios') {
    const totalP = municipios.filter(m => m.isPriority).length;
    titulo = '⭐ Prioridade Estratégica';
    itens = [
      { label: `Prioritários (${totalP})`, cor: '#e8b923' },
      { label: `Demais (${municipios.length - totalP})`, cor: '#cbd5e1' }
    ];
  }

  return (
    <div className="leaflet-control" style={{
      position: 'absolute', bottom: '16px', right: '16px', zIndex: 1000,
      background: '#ffffff', padding: '12px 14px', borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '12px', border: '1px solid #dde3ea'
    }}>
      <h4 style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: '700', color: '#0b3c5d', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {titulo}
      </h4>
      {itens.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px', gap: '8px' }}>
          <span style={{ background: item.cor, width: '14px', height: '14px', borderRadius: '3px', border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }}></span>
          <span style={{ color: '#22313f', fontWeight: 500 }}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Botão de controle de mapa (Reset / Layer Switcher)
function MapOverlayControls({ activeTile, setActiveTile, geoJSONData }) {
  const map = useMap();

  const handleResetView = () => {
    if (geoJSONData) {
      try {
        const geoLayer = L.geoJSON(geoJSONData);
        const bounds = geoLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (e) {
        map.setView([-5.2, -45.2], 7);
      }
    } else {
      map.setView([-5.2, -45.2], 7);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '12px',
      right: '12px',
      zIndex: 1000,
      display: 'flex',
      gap: '8px'
    }}>
      {/* Reset view */}
      <button
        onClick={handleResetView}
        title="Centralizar estado do Maranhão"
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#0b3c5d',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        🎯 Centralizar Maranhão
      </button>

      {/* Layer selector */}
      <select
        value={activeTile}
        onChange={(e) => setActiveTile(e.target.value)}
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          padding: '6px 10px',
          fontSize: '12px',
          fontWeight: 600,
          color: '#0b3c5d',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          outline: 'none'
        }}
      >
        {Object.entries(TILE_LAYERS).map(([key, layer]) => (
          <option key={key} value={key}>{layer.name}</option>
        ))}
      </select>
    </div>
  );
}

function MapInitHelper() {
  const map = useMap();
  const setMapInstance = useStore(state => state.setMapInstance);

  useEffect(() => {
    if (map) {
      setMapInstance(map);
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [map, setMapInstance]);

  return null;
}

export function MapaLeaflet({
  municipios,
  onMunicipioClick,
  modoMapa = 'grupo',
  center = [-5.2, -45.2],
  zoom = 7,
  height = '620px',
  id = 'map'
}) {
  const { geoJSONData, setGeoJSONData } = useStore();
  const [activeTile, setActiveTile] = useState('carto');

  useEffect(() => {
    if (!geoJSONData) {
      fetch('/ma_municipios.min.geojson')
        .then(r => r.json())
        .then(data => setGeoJSONData(data))
        .catch(err => console.error('Erro ao carregar GeoJSON:', err));
    }
  }, [geoJSONData, setGeoJSONData]);

  if (!geoJSONData) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8', borderRadius: '10px', border: '1px solid #dde3ea' }}>
        <div style={{ textAlign: 'center', color: '#7a8a99' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🗺️</div>
          <div style={{ fontWeight: 600, color: '#0b3c5d' }}>Carregando dados cartográficos do Maranhão...</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Projeção geográfica dos 217 municípios</div>
        </div>
      </div>
    );
  }

  const currentTile = TILE_LAYERS[activeTile] || TILE_LAYERS.carto;
  const geoJsonKey = `${modoMapa}-${municipios.length}`;

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={5}
        maxZoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '10px', border: '1px solid #dde3ea' }}
      >
        <MapInitHelper />
        <AutoFitMaranhao geoJSONData={geoJSONData} />
        <TileLayer
          key={activeTile}
          url={currentTile.url}
          attribution={currentTile.attribution}
          subdomains="abcd"
          maxZoom={19}
        />
        <GeoJSON
          key={geoJsonKey}
          data={geoJSONData}
          style={(feature) => getStyle(feature, municipios, modoMapa)}
          onEachFeature={(feature, layer) => setupFeature(feature, layer, municipios, modoMapa, onMunicipioClick)}
        />
        <MapController municipios={municipios} modoMapa={modoMapa} onMunicipioClick={onMunicipioClick} />
        <LegendControl municipios={municipios} modoMapa={modoMapa} />
        <MapOverlayControls activeTile={activeTile} setActiveTile={setActiveTile} geoJSONData={geoJSONData} />
      </MapContainer>
    </div>
  );
}

export function MapaGrandeLeaflet(props) {
  return <MapaLeaflet {...props} height="650px" id="mapGrande" />;
}
