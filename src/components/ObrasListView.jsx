import { useState, useMemo } from 'react';
import { formatCurrency, normalizeString } from '../data/municipios';
import { ChevronDown, ChevronUp, MapPin, Briefcase, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * ObrasListView — Visão em cards/lista para obras por município
 * - Cards expansíveis com detalhes da obra
 * - Badges coloridas por status
 * - Responsivo: grid desktop → lista mobile
 */

const STATUS_STYLES = {
  CONCLUIDA: { label: 'Entregue', icon: '🟢', color: '#10b981', bg: '#ecfdf5' },
  ANDAMENTO: { label: 'Em Andamento', icon: '🔵', color: '#3b82f6', bg: '#eff6ff' },
  PARALISA: { label: 'Paralisada', icon: '🔴', color: '#ef4444', bg: '#fef2f2' },
  NAO_INICIADA: { label: 'Não Iniciada', icon: '⚪', color: 'var(--texto-secundario)', bg: '#f8fafc' },
};

export function ObrasListView({ municipios }) {
  const [expandedMunicipio, setExpandedMunicipio] = useState(null);
  const [busca, setBusca] = useState('');

  // Consolidar todas as obras por município
  const obrasPorMunicipio = useMemo(() => {
    return (municipios || []).map(mun => {
      const eixos = mun?.eixos && Array.isArray(mun.eixos) ? mun.eixos : [];
      return {
        municipio: mun.nome,
        ibge: mun.ibge,
        grupo: mun.grupo,
        prefeito: mun.prefeito,
        obras: eixos.map((obra, idx) => ({
          id: `${mun.ibge}-${idx}`,
          objeto: obra.desc || obra.objeto || '—',
          orgao: obra.orgao || '—',
          status: obra.status || '—',
          pct: typeof obra.pct === 'number' ? obra.pct : 0,
          orcamento: obra.orcamento || 0,
        }))
      };
    }).filter(mun => mun.obras.length > 0);
  }, [municipios]);

  // Filtrar por busca
  const filtrados = useMemo(() => {
    if (!busca.trim()) return obrasPorMunicipio;
    const q = normalizeString(busca);
    return obrasPorMunicipio.filter(mun =>
      normalizeString(mun.municipio).includes(q) ||
      normalizeString(mun.prefeito || '').includes(q) ||
      mun.obras.some(o =>
        normalizeString(o.objeto).includes(q) ||
        normalizeString(o.orgao).includes(q) ||
        normalizeString(o.status).includes(q)
      )
    );
  }, [obrasPorMunicipio, busca]);

  const getObraStatus = (status) => {
    const upper = status.toUpperCase();
    if (/CONCLU|ENTREGUE|INAUGURADA/.test(upper)) return STATUS_STYLES.CONCLUIDA;
    if (/EXECU|ANDAMENTO|MOBILIZA/.test(upper)) return STATUS_STYLES.ANDAMENTO;
    if (/PARALISADA|PARADA|SUSPENSA/.test(upper)) return STATUS_STYLES.PARALISA;
    return STATUS_STYLES.NAO_INICIADA;
  };

  const toggleMunicipio = (ibge) => {
    setExpandedMunicipio(expandedMunicipio === ibge ? null : ibge);
  };

  // Stats
  const totalObras = filtrados.reduce((s, m) => s + m.obras.length, 0);
  const totalInvestimento = filtrados.reduce((s, m) =>
    s + m.obras.reduce((sub, o) => sub + o.orcamento, 0), 0);

  return (
    <div className="obras-list-view" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Buscar obras, município, órgão..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid var(--borda)', borderRadius: '8px', color: 'var(--texto)' }}
          />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 600 }}>
          {filtrados.length} município(s) · {totalObras} obra(s)
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--texto-secundario)', fontWeight: 600 }}>Total Investido</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--heading)', marginTop: '4px' }}>{formatCurrency(totalInvestimento)}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '8px', padding: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--texto-secundario)', fontWeight: 600 }}>Municípios Ativos</div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--heading)', marginTop: '4px' }}>{filtrados.length}</div>
        </div>
      </div>

      {/* Cards de Municípios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
        {filtrados.map((mun, idx) => {
          const isExpanded = expandedMunicipio === mun.ibge;
          const concluidas = mun.obras.filter(o => /CONCLU|ENTREGUE|INAUGURADA/.test(o.status)).length;
          const andamento = mun.obras.filter(o => /EXECU|ANDAMENTO|MOBILIZA/.test(o.status)).length;
          const paralisadas = mun.obras.filter(o => /PARALISADA|PARADA|SUSPENSA/.test(o.status)).length;

          return (
            <div key={mun.ibge || idx} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--borda)',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'box-shadow 0.2s'
            }}>
              {/* Cabeçalho do Card */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                   onClick={() => toggleMunicipio(mun.ibge)}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--heading)', marginBottom: '4px' }}>
                    📍 {mun.municipio}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--texto-secundario)' }}>
                    Prefeito: <strong>{mun.prefeito || '—'}</strong>
                  </div>
                </div>
                <button style={{
                  background: 'transparent',
                  border: '1px solid var(--borda)',
                  borderRadius: '6px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: 'var(--texto-secundario)'
                }}>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Stats Mini */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>✅ {concluidas}</span>
                <span style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 600 }}>🔄 {andamento}</span>
                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>⛔ {paralisadas}</span>
              </div>

              {/* Detalhes Expansíveis */}
              {isExpanded && (
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--borda)', paddingTop: '14px' }}>
                  {mun.obras.map((obra, i) => {
                    const statusStyle = getObraStatus(obra.status);
                    return (
                      <div key={obra.id || i} style={{
                        padding: '10px 12px',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        border: '1px solid var(--borda)',
                        background: '#fafbfc'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#fb3b2d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                            Obra #{i + 1}
                          </span>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            color: statusStyle.color,
                            background: statusStyle.bg
                          }}>
                            {statusStyle.icon} {statusStyle.label}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px', lineHeight: '1.4' }}>
                          <strong>Objeto:</strong> {obra.objeto}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--texto-secundario)', marginTop: '6px' }}>
                          <span>🏢 {obra.orgao}</span>
                          <span>💰 {formatCurrency(obra.orcamento)}</span>
                          <span>📊 {obra.pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtrados.length === 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--texto-secundario)', fontSize: '14px' }}>
          Nenhuma obra encontrada para os filtros atuais.
        </div>
      )}
    </div>
  );
}
