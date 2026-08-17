import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MUNICIPIOS_POR_IBGE, corDoGrupo, labelDoGrupo, numero } from '../lib/dados';
import { useStore } from '../lib/store';

const CENTRO = [-5.2, -45.3];

export function MapaPolitico({ visiveis }) {
  const [geo, setGeo] = useState(null);
  const [erro, setErro] = useState(null);
  const selecionar = useStore((s) => s.setMunicipioSelecionado);
  const camadaRef = useRef(null);

  const idsVisiveis = useMemo(() => new Set(visiveis.map((m) => m.ibge)), [visiveis]);

  useEffect(() => {
    let ativo = true;
    fetch('/ma_municipios.min.geojson')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => ativo && setGeo(d))
      .catch((e) => ativo && setErro(e.message));
    return () => { ativo = false; };
  }, []);

  const estilo = (feature) => {
    const ibge = String(feature.properties.CD_MUN);
    const m = MUNICIPIOS_POR_IBGE.get(ibge);
    const dentro = idsVisiveis.has(ibge);
    return {
      color: '#ffffff',
      weight: 0.7,
      fillColor: m ? corDoGrupo(m.grupo) : '#cbd5e1',
      fillOpacity: dentro ? 0.82 : 0.12,
    };
  };

  const aoCriarFeature = (feature, layer) => {
    const ibge = String(feature.properties.CD_MUN);
    const m = MUNICIPIOS_POR_IBGE.get(ibge);
    const nome = m?.nome || feature.properties.NM_MUN;

    layer.bindTooltip(
      `<strong>${nome}</strong><br/>${m ? labelDoGrupo(m.grupo) : 'Sem dados'}${
        m?.totalObras ? ` · ${numero(m.totalObras)} obras` : ''
      }`,
      { sticky: true, direction: 'top' },
    );

    layer.on({
      mouseover: (e) => e.target.setStyle({ weight: 2.2, color: '#0f172a', fillOpacity: 0.95 }),
      mouseout: (e) => camadaRef.current?.resetStyle(e.target),
      click: () => m && selecionar(m.ibge),
    });
  };

  // Reaplica estilos quando os filtros mudam
  useEffect(() => {
    camadaRef.current?.setStyle(estilo);
  }, [idsVisiveis]); // eslint-disable-line react-hooks/exhaustive-deps

  if (erro) {
    return <div className="vazio">Não foi possível carregar o mapa ({erro}).</div>;
  }

  return (
    <div className="mapa-container">
      <MapContainer center={CENTRO} zoom={6} scrollWheelZoom minZoom={5} maxZoom={11}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> · OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {geo && (
          <GeoJSON
            ref={camadaRef}
            data={geo}
            style={estilo}
            onEachFeature={aoCriarFeature}
          />
        )}
      </MapContainer>
    </div>
  );
}
