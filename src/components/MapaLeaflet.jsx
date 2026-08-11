import { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
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
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

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
    attribution: 'Tiles &copy; Esri'
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

// Escala de cores para coroplético de obras
const OBRAS_COLOR_SCALE = [
  { max: 0, cor: '#e2e8f0' },
  { max: 2, cor: '#9ecae1' },
  { max: 5, cor: '#3182bd' },
  { max: Infinity, cor: '#08519c' }
];

// Escala de cores para investimento
const INVESTIMENTO_COLOR_SCALE = [
  { max: 0, cor: '#f1f5f9' },
  { max: 500000, cor: '#fcae91' },
  { max: 2000000, cor: '#fb6a4a' },
  { max: Infinity, cor: '#cb181d' }
];

/**
 * Função de estilo dinâmico para polígonos do GeoJSON.
 * Calcula fillColor e fillOpacity baseado no modoMapa e dados do município.
 * Todos os campos usam fallbacks para evitar quebras quando dados são ausentes.
 */
export const getStyle = (feature, municipios, modoMapa = 'grupo', isHighlighted = false, mesorregiaoFilter = null) => {
  const ibge = feature?.properties?.CD_MUN || '';
  const mun = municipios.find(m => m.ibge === ibge) || {};

  const isPriority = PRIORITY_IBGES.has(ibge);

  // Se mesorregião filtrada, municípios fora têm opacidade reduzida
  if (mesorregiaoFilter && mesorregiaoFilter !== 'todas' && mun.mesorregiao !== mesorregiaoFilter) {
    return {
      fillColor: '#cbd5e1',
      weight: 1,
      opacity: 1,
      color: 'rgba(0,0,0,0.2)',
      fillOpacity: 0.25,
      dashArray: '3,3'
    };
  }

  let cor = '#BDC3C7';
  let opacity = 0.65;
  let weight = 1;
  let strokeColor = 'rgba(0,0,0,0.3)';

  if (isHighlighted) {
    return {
      fillColor: cor,
      weight: 4,
      opacity: 1,
      color: '#0b3c5d',
      fillOpacity: 0.95
    };
  }

  if (modoMapa === 'grupo') {
    cor = mun.cor || CORES[mun.grupo] || '#BDC3C7';
    opacity = isPriority ? 0.85 : 0.65;
    weight = isPriority ? 2.5 : 1;
    strokeColor = isPriority ? '#0b3c5d' : 'rgba(0,0,0,0.3)';
  } else if (modoMapa === 'obras') {
    const totalObras = Number(mun.total_obras) || 0;
    const entry = OBRAS_COLOR_SCALE.find(s => totalObras <= s.max);
    cor = entry?.cor || '#e2e8f0';
    opacity = 0.75;
  } else if (modoMapa === 'investimento') {
    const val = parseInvestimento(mun.investimento_planner);
    const entry = INVESTIMENTO_COLOR_SCALE.find(s => val <= s.max);
    cor = entry?.cor || '#f1f5f9';
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
};

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
function MapController({ municipios, modoMapa, geoJSONData }) {
  const map = useMap();
  const { municipioId } = useStore();
  const geoJsonRef = useRef(null);

  useEffect(() => {
    if (municipioId && geoJSONData) {
      map.eachLayer((layer) => {
        if (layer.feature?.properties?.CD_MUN === municipioId) {
          layer.setStyle({ weight: 4, color: '#0b3c5d', fillOpacity: 0.95 });
          layer.bringToFront();
          try {
            map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 11 });
          } catch (e) {
            // ignore bounds error
          }
        }
      });
    }
  }, [municipioId, geoJSONData, map]);

  return null;
}

/**
 * Configura interações de cada polígono (hover, click, tooltip).
 * Tooltip usa classes Tailwind via DivIcon.
 */
export const setupFeature = (
  feature,
  layer,
  municipios,
  modoMapa,
  onMunicipioClick,
  flyToCallback,
  mesorregiaoFilter = null
) => {
  const ibge = feature.properties.CD_MUN || '';
  const nome = feature.properties.NM_MUN || 'Município sem nome';
  const mun = municipios.find(m => m.ibge === ibge) || {};

  // Estado para destaque
  let isHighlighted = false;

  layer.on({
    mouseover: (e) => {
      isHighlighted = true;
      const l = e.target;
      l.setStyle({ weight: 3, color: '#ffffff', fillOpacity: 0.95 });
      l.bringToFront();
      const tooltip = l?.getTooltip?.();
      if (tooltip) tooltip.updateContent(buildTooltipContent(mun, nome, modoMapa));
      flyToCallback?.('hover', ibge);
    },
    mouseout: (e) => {
      isHighlighted = false;
      const defaultStyle = getStyle(feature, municipios, modoMapa, false, mesorregiaoFilter);
      e.target.setStyle(defaultStyle);
      flyToCallback?.('unhover', null);
    },
    click: () => {
      // Fly to bounds via callback
      try {
        if (layer.getBounds) {
          flyToCallback?.('flyto', ibge);
        }
      } catch (e) {
        // ignore bounds error
      }
      if (onMunicipioClick) onMunicipioClick(ibge, nome);
    }
  });

  // Bind tooltip customizado (Tailwind-based DivIcon content)
  const tooltipContent = buildTooltipContent(mun, nome, modoMapa);
  layer.bindTooltip(tooltipContent, {
    sticky: true,
    direction: 'top',
    className: 'segov-tooltip',
    offset: [0, 8]
  });
};

/**
 * Conteúdo do tooltip — usa classes Tailwind.
 */
function buildTooltipContent(mun, nome, modoMapa) {
  const groupLabel = LABELS[mun.grupo] || mun.grupo || 'Indefinido';
  const corGrupo = CORES[mun.grupo] || '#BDC3C7';
  let infoExtra = '';

  if (modoMapa === 'grupo') {
    infoExtra = `🎯 ${groupLabel}`;
  } else if (modoMapa === 'obras') {
    infoExtra = `🏗️ ${Number(mun.total_obras) || 0} obra(s)`;
  } else if (modoMapa === 'investimento') {
    infoExtra = `💰 ${formatCurrency(mun.investimento_planner)}`;
  } else if (modoMapa === 'prioritarios') {
    infoExtra = PRIORITY_IBGES.has(mun.ibge) ? '⭐ Prioritário' : 'Município Regular';
  }

  // Construir HTML com classes Tailwind
  // Nota: Leaflet tooltips renderizam via innerHTML, então usamos classes Tailwind com estilos inline mínimos
  return `
    <div class="segov-tooltip-inner font-inherit">
      <div class="text-sm font-semibold" style="color: #0b3c5d; font-size: 13px;">
        ${nome}
      </div>
      <div class="text-xs mt-0.5" style="color: #475569;">
        IBGE ${mun.ibge || 'N/A'}
      </div>
      <div class="mt-1 flex items-center gap-1 text-xs" style="color: #22313f;">
        <span class="w-2 h-2 rounded-full" style="background: ${corGrupo};"></span>
        ${groupLabel}
      </div>
      <div class="text-xs mt-0.5" style="color: #64748b;">
        ${mun.prefeito ? `Prefeito: ${mun.prefeito}` : 'Prefeito: --'}
        <br/>
        ${infoExtra}
      </div>
      ${modoMapa === 'obras' ? `<div class="text-xs mt-0.5" style="color: #64748b;">Equipamentos: ${mun.equipamento_solicitado || 'Nenhum'}</div>` : ''}
      ${modoMapa === 'investimento' && mun.investimento_planner ? `<div class="text-xs mt-0.5" style="color: #64748b;">${formatCurrency(mun.investimento_planner)}</div>` : ''}
    </div>
  `;
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
    const totalP = municipios.filter(m => PRIORITY_IBGES.has(m.ibge)).length;
    titulo = '⭐ Prioridade Estratégica';
    itens = [
      { label: `Prioritários (${totalP})`, cor: '#e8b923' },
      { label: `Demais (${municipios.length - totalP})`, cor: '#cbd5e1' }
    ];
  }

  return (
    <div className="leaflet-control absolute bottom-4 right-4 z-[1000] bg-white p-3 rounded-xl shadow-lg text-xs border border-gray-200 max-w-[220px]">
      <h4 className="text-xs font-bold mb-2" style={{ color: '#0b3c5d', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
        {titulo}
      </h4>
      {itens.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 mb-1">
          <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ background: item.cor, border: '1px solid rgba(0,0,0,0.15)' }}></span>
          <span className="font-medium text-gray-800">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// Botão de controle de mapa (Reset / Layer Switcher)
function MapOverlayControls({ activeTile, setActiveTile, geoJSONData }) {
  const map = useMap();

  const handleResetView = useCallback(() => {
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
  }, [geoJSONData, map]);

  return (
    <div className="absolute top-3 right-3 z-[1000] flex gap-2">
      {/* Reset view */}
      <button
        onClick={handleResetView}
        title="Centralizar estado do Maranhão"
        className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#0b3c5d] cursor-pointer shadow-md flex items-center gap-1 hover:bg-gray-50 transition-colors"
      >
        🎯 Centralizar MA
      </button>

      {/* Layer selector */}
      <select
        value={activeTile}
        onChange={(e) => setActiveTile(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0b3c5d] cursor-pointer shadow-md outline-none focus:ring-1 focus:ring-indigo-500"
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

/**
 * MapaLeaflet — Mapa coroplético interativo do Maranhão.
 *
 * Recursos:
 * - Coroplético dinâmico por grupo, obras, investimento ou prioritários
 * - Hover com destaque de borda e tooltip Tailwind
 * - Click → flyTo + abre detalhes no store (setMunicipioId)
 * - Reage a filtros de mesorregião
 * - React.memo + useMemo + useCallback para performance
 */
function MapaLeafletBase({
  municipios,
  onMunicipioClick,
  modoMapa = 'grupo',
  center = [-5.2, -45.2],
  zoom = 7,
  height = '620px',
  id = 'map',
  filteredIbges = null, // Set<string> de IBGEs visíveis
  mesorregiaoFilter = null // string | null
}) {
  const { geoJSONData, setGeoJSONData } = useStore();
  const [activeTile, setActiveTile] = useState('carto');
  const mapRef = useRef(null);

  // Carregar GeoJSON uma vez
  useEffect(() => {
    if (!geoJSONData) {
      fetch('/ma_municipios.min.geojson')
        .then(r => r.json())
        .then(data => setGeoJSONData(data))
        .catch(err => console.error('Erro ao carregar GeoJSON:', err));
    }
  }, [geoJSONData, setGeoJSONData]);

  // Memoizar dados processados do GeoJSON (evitar re-cálculos)
  const processedGeoJSON = useMemo(() => {
    if (!geoJSONData) return null;
    return geoJSONData;
  }, [geoJSONData]);

  // FlyTo callback — usa a instância do mapa
  const flyToCallback = useCallback((action, ibge) => {
    const map = mapRef.current;
    if (!map || !processedGeoJSON || !action) return;

    if (action === 'flyto' && ibge) {
      try {
        const layer = L.geoJSON(processedGeoJSON, {
          filter: (f) => f?.properties?.CD_MUN === ibge
        });
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 11, duration: 0.8 });
        }
      } catch (e) {
        console.error('FlyTo error:', e);
      }
    }
  }, [processedGeoJSON]);

  if (!processedGeoJSON) {
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
  const geoJsonKey = `${modoMapa}-${municipios.length}-${mesorregiaoFilter || 'all'}`;

  // Memoizar handlers para evitar re-criações
  const handleEachFeature = useCallback((feature, layer) => {
    setupFeature(feature, layer, municipios, modoMapa, onMunicipioClick, flyToCallback, mesorregiaoFilter);
  }, [municipios, modoMapa, onMunicipioClick, flyToCallback, mesorregiaoFilter]);

  const getStyleMemo = useCallback((feature) => {
    return getStyle(feature, municipios, modoMapa, false, mesorregiaoFilter);
  }, [municipios, modoMapa, mesorregiaoFilter]);

  // Filtro por mesorregião
  const geoJsonFilter = useCallback((feature) => {
    if (!filteredIbges) return true;
    return filteredIbges.has(feature?.properties?.CD_MUN);
  }, [filteredIbges]);

  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={5}
        maxZoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '10px', border: '1px solid #dde3ea' }}
        ref={mapRef}
      >
        <MapInitHelper />
        <AutoFitMaranhao geoJSONData={processedGeoJSON} />
        <TileLayer
          key={activeTile}
          url={currentTile.url}
          attribution={currentTile.attribution}
          subdomains="abcd"
          maxZoom={19}
        />
        <GeoJSON
          key={geoJsonKey}
          data={processedGeoJSON}
          style={getStyleMemo}
          onEachFeature={handleEachFeature}
          filter={geoJsonFilter}
        />
        <MapController municipios={municipios} modoMapa={modoMapa} geoJSONData={processedGeoJSON} />
        <LegendControl municipios={municipios} modoMapa={modoMapa} />
        <MapOverlayControls activeTile={activeTile} setActiveTile={setActiveTile} geoJSONData={processedGeoJSON} />
      </MapContainer>
    </div>
  );
}

// React.memo para evitar re-renderizações desnecessárias
export const MapaLeaflet = memo(MapaLeafletBase, (prevProps, nextProps) => {
  return (
    prevProps.municipios === nextProps.municipios &&
    prevProps.modoMapa === nextProps.modoMapa &&
    prevProps.height === nextProps.height &&
    prevProps.center?.[0] === nextProps.center?.[0] &&
    prevProps.center?.[1] === nextProps.center?.[1] &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.filteredIbges === nextProps.filteredIbges &&
    prevProps.mesorregiaoFilter === nextProps.mesorregiaoFilter &&
    prevProps.onMunicipioClick === nextProps.onMunicipioClick
  );
});

export function MapaGrandeLeaflet(props) {
  return <MapaLeaflet {...props} height="650px" id="mapGrande" />;
}

export default MapaLeaflet;