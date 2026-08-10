import { useEffect, useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { MapaLeaflet } from '../components/MapaLeaflet';
import { formatCurrency, CORES, LABELS, normalizeString } from '../data/municipios';
import { MapPin, Search, Layers, X, Hammer, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MapaPoliticoPage() {
  const navigate = useNavigate();
  const { 
    getMunicipiosFiltrados, 
    municipioId,
    setMunicipioId,
    geoJSONData,
    initTema
  } = useStore();
  
  const [modoMapa, setModoMapa] = useState('grupo'); // 'grupo' | 'obras' | 'investimento' | 'prioritarios'
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Município atualmente selecionado
  const selectedMun = useMemo(() => {
    if (!municipioId) return null;
    return municipiosFiltrados.find(m => m.ibge === municipioId) || null;
  }, [municipioId, municipiosFiltrados]);

  // Lista para busca rápida na lateral
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return municipiosFiltrados.slice(0, 50);
    const norm = normalizeString(searchTerm);
    return municipiosFiltrados.filter(m => normalizeString(m.nome).includes(norm)).slice(0, 50);
  }, [municipiosFiltrados, searchTerm]);

  const handleMunicipioClick = (ibge) => {
    setMunicipioId(ibge);
  };

  return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
     
        {/* Top Controls Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #dde3ea',
        borderRadius: '10px',
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={20} color="#0b3c5d" />
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0b3c5d', margin: 0 }}>
            Mapa Político-Estratégico Interativo (GIS)
          </h2>
        </div>

        {/* Botoes de Modo de Visualização */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setModoMapa('grupo')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: modoMapa === 'grupo' ? '1.5px solid #0b3c5d' : '1px solid #cbd5e1',
              background: modoMapa === 'grupo' ? '#0b3c5d' : '#ffffff',
              color: modoMapa === 'grupo' ? '#ffffff' : '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            🎯 Grupos Políticos
          </button>

          <button
            onClick={() => setModoMapa('obras')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: modoMapa === 'obras' ? '1.5px solid #0b3c5d' : '1px solid #cbd5e1',
              background: modoMapa === 'obras' ? '#0b3c5d' : '#ffffff',
              color: modoMapa === 'obras' ? '#ffffff' : '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            🏗️ Volume de Obras
          </button>

          <button
            onClick={() => setModoMapa('investimento')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: modoMapa === 'investimento' ? '1.5px solid #0b3c5d' : '1px solid #cbd5e1',
              background: modoMapa === 'investimento' ? '#0b3c5d' : '#ffffff',
              color: modoMapa === 'investimento' ? '#ffffff' : '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            💰 Investimentos
          </button>

          <button
            onClick={() => setModoMapa('prioritarios')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: modoMapa === 'prioritarios' ? '1.5px solid #0b3c5d' : '1px solid #cbd5e1',
              background: modoMapa === 'prioritarios' ? '#0b3c5d' : '#ffffff',
              color: modoMapa === 'prioritarios' ? '#ffffff' : '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s'
            }}
          >
            ⭐ Prioritários
          </button>
        </div>
      </div>

      {/* Grid Principal: Mapa (70%) + Painel Lateral de Detalhes (30%) */}
      <div className="mapa-politico-grid">
        
        {/* Lado Esquerdo: Mapa do Maranhão */}
        <div className="mapa-canvas-card">
          <MapaLeaflet 
            municipios={municipiosFiltrados}
            modoMapa={modoMapa}
            onMunicipioClick={handleMunicipioClick}
            height="100%"
            id="mapaPoliticoGIS"
          />
        </div>

        {/* Lado Direito: Card de Detalhes do Município Selecionado OU Diretório de Busca */}
        <div className="mapa-sidebar-card">
          {selectedMun ? (
            /* Painel de Detalhes do Município Selecionado */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#7a8a99', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    IBGE {selectedMun.ibge}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0b3c5d', margin: '2px 0 0' }}>
                    {selectedMun.nome}
                  </h3>
                </div>
                <button
                  onClick={() => setMunicipioId(null)}
                  title="Fechar detalhes"
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center'
                  }}
                >
                  <X size={16} color="#64748b" />
                </button>
              </div>

              {/* Badges de Status */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: CORES[selectedMun.grupo] || '#BDC3C7',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  🎯 {LABELS[selectedMun.grupo] || selectedMun.grupo}
                </span>

                {selectedMun.isPriority && (
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    background: '#e8b923',
                    color: '#0b3c5d',
                    fontSize: '11px',
                    fontWeight: 700
                  }}>
                    ⭐ Prioritário
                  </span>
                )}
              </div>

              {/* Informações Políticas */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Prefeito / Liderança Principal:</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0b3c5d' }}>
                  {selectedMun.prefeito || 'Não registrado'}
                </div>
              </div>

              {/* Mapeamento de Obras & Investimentos */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>TOTAL DE OBRAS</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#2980B9', marginTop: '2px' }}>
                    {selectedMun.total_obras || 0}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>INVESTIMENTO</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#27ae60', marginTop: '4px' }}>
                    {formatCurrency(selectedMun.investimento_planner)}
                  </div>
                </div>
              </div>

              {/* Equipamentos Solicitados */}
              {selectedMun.equipamento_solicitado && (
                <div style={{ background: '#fffbeb', border: '1px solid #fef08a', padding: '10px 12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>
                    🚜 Equipamento Solicitado
                  </div>
                  <div style={{ fontSize: '12px', color: '#78350f', marginTop: '2px', fontWeight: 600 }}>
                    {selectedMun.equipamento_solicitado}
                  </div>
                  {selectedMun.solicitante && (
                    <div style={{ fontSize: '11px', color: '#a16207', marginTop: '2px' }}>
                      Solicitante: {selectedMun.solicitante}
                    </div>
                  )}
                </div>
              )}

              {/* Botão de Redirecionamento para Obras */}
              <button
                onClick={() => navigate('/obras')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: '#0b3c5d',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  gap: '6px',
                  marginTop: '8px'
                }}
              >
                <Hammer size={14} /> Ver Obras no Painel Completo <ChevronRight size={14} />
              </button>

            </div>
          ) : (
            /* Busca e Diretório de Municípios quando nenhum está selecionado */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0b3c5d', margin: '0 0 4px' }}>
                  🔍 Localizar Município no Mapa
                </h3>
                <p style={{ fontSize: '11px', color: '#7a8a99', margin: 0 }}>
                  Digite o nome da cidade para destacar e aproximar a câmera.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#7a8a99" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  placeholder="Buscar município..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px 8px 32px',
                    borderRadius: '8px',
                    border: '1px solid #dde3ea',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ fontSize: '11px', fontWeight: 600, color: '#7a8a99', marginTop: '4px' }}>
                Exibindo {filteredList.length} município(s):
              </div>

              {/* Lista Scrollável */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {filteredList.map(mun => (
                  <div
                    key={mun.ibge}
                    onClick={() => setMunicipioId(mun.ibge)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#0b3c5d'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#0b3c5d' }}>
                        {mun.nome}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>
                        {LABELS[mun.grupo] || mun.grupo} • {mun.total_obras || 0} obras
                      </div>
                    </div>
                    <MapPin size={14} color="#0b3c5d" />
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
