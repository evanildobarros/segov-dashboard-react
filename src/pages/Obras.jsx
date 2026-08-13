import { useEffect, useState, useMemo, useCallback } from 'react';
import { useStore } from '../hooks/useStore';
import { ChartSituacao } from '../components/ChartsObras';
import { ChartEixos } from '../components/ChartEixos';
import { formatCurrency } from '../data/municipios';
import eixosDataRaw from '../data/eixos_obras.json';

// Ícones SVG simples para eixos
const EIXO_ICONS = {
  POÇOS: '🚰',
  EDUCAÇÃO: '🏫',
  'ESCOLA MILITAR - BOMBEIRO': '🎓',
  'ESPORTE E LAZER': '⚽',
  DELEGACIAS: '🚓',
  SAÚDE: '🏥',
  'SEGURANÇA/PM': '🛡️',
  PORTAL: '🖥️',
  'ESTAÇÃO TECH': '📡',
  PRAÇA: '🪑',
  AGED: '📋',
  IEMA: '🌱',
  'PATRIMÔNIO E INSTITUCIONAL': '🏛️',
  OUTROS: '—'
};

const EIXO_LABELS = {
  POÇOS: 'Águas/Poços',
  EDUCAÇÃO: 'Educação',
  'ESCOLA MILITAR - BOMBEIRO': 'Escola Militar',
  'ESPORTE E LAZER': 'Esporte/Lazer',
  DELEGACIAS: 'Delegacias',
  SAÚDE: 'Saúde',
  'SEGURANÇA/PM': 'Segurança',
  PORTAL: 'Portal',
  'ESTAÇÃO TECH': 'Estação Tech',
  PRAÇA: 'Praças',
  AGED: 'AGED',
  IEMA: 'IEMA',
  'PATRIMÔNIO E INSTITUCIONAL': 'Patrimônio'
};

function getListaEixos(municipios = []) {
  const seen = new Set();
  municipios.forEach(mun => {
    const obras = mun?.eixos && Array.isArray(mun.eixos) ? mun.eixos : [];
    obras.forEach(obra => {
      const orgao = obra.orgao || 'OUTROS';
      if (!seen.has(orgao) && (orgao !== 'OUTROS' || !municipios.find(m => (m?.eixos || []).some(o => o.orgao === 'OUTROS')))) {
        seen.add(orgao);
      }
    });
  });
  return Array.from(seen).sort();
}

// Deriva a previsão de conclusão a partir do status/percentual da obra
function previsaoConclusao(obra) {
  const status = (obra.status || '').toUpperCase();
  const pct = typeof obra.pct === 'number' ? obra.pct : 0;
  if (/CONCLU|ENTREGUE|INAUGURADA/.test(status) || pct >= 100) return 'Concluída';
  if (/EXECU|ANDAMENTO|MOBILIZA/.test(status)) return 'Em andamento — conclusão a definir';
  if (/AG\. APROVA|APROVA/.test(status)) return 'Aguardando aprovação orçamentária';
  if (/AG\. PROJETO|PROJETO E ORC/.test(status)) return 'Aguardando projeto e orçamento';
  if (/PARALISADA|PARADA|SUSPENSA/.test(status)) return 'Paralisada — sem previsão definida';
  if (pct > 0) return `Em execução (${pct}%) — conclusão a definir`;
  return 'A iniciar — sem previsão informada';
}

export function ObrasPage() {
  const { getMunicipiosFiltrados, municipios, setGrupo } = useStore();
  const [municipioSelected, setMunicipioSelected] = useState('todos');
  const [eixoSelected, setEixoSelected] = useState(null);

  useEffect(() => {
    setGrupo('todos');
  }, [setGrupo]);

  const municipiosFiltrados = getMunicipiosFiltrados();
  const allEixos = useMemo(() => getListaEixos(municipios), [municipios]);

  // Filtrar por eixo (órgão) dentro do eixos array de cada município
  const listaExibicao = useMemo(() => {
    return municipios.filter(m => {
      const { grupo, busca } = useStore.getState();
      let match = true;
      if (grupo && grupo !== 'todos') {
        match = match && (m.grupo === grupo);
      }
      if (busca) {
        const q = busca.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        match = match && (
          (m.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q) ||
          (m.prefeito || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
        );
      }
      // Filtra por eixo/orgão
      if (eixoSelected) {
        const obras = m?.eixos && Array.isArray(m.eixos) ? m.eixos : [];
        match = match && obras.some(o => o.orgao === eixoSelected);
      }
      if (municipioSelected !== 'todos') {
        match = match && String(m.ibge || m.id) === String(municipioSelected);
      }
      return match;
    });
  }, [municipios, eixoSelected, municipioSelected]);

  const totalObras = listaExibicao.reduce((s, m) => s + (m.total_obras || 0), 0);
  const totalInvestimento = listaExibicao.reduce((s, m) => {
    const val = parseFloat(String(m.investimento_planner || '0').replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
    return s + val;
  }, 0);

  // Contar municípios prioritários na lista filtrada
  const totalPrioritarios = listaExibicao.reduce((s, m) => s + (m.prioritario ? 1 : 0), 0);
  const totalVisiveis = listaExibicao.length;

  const toggleEixo = useCallback((eixo) => {
    setEixoSelected(prev => prev === eixo ? null : eixo);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
      {/* KPIs */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '14px'
      }}>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#0b3c5d', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Total Obras</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b3c5d', marginTop: '4px' }}>{totalObras}</div>
          <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>no PLANNER SEGOV</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#1b9e5a', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Investimento Total</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b3c5d', marginTop: '4px' }}>{formatCurrency(totalInvestimento)}</div>
        </div>
      </div>

      {/* Barra de Filtros - estilo similar ao screenshot */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap'
      }}>
        {/* Label Filtro */}
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Filtro:</span>

        {/* Filtro de Eixos de Obras */}
        <select
          value={eixoSelected || ''}
          onChange={(e) => setEixoSelected(e.target.value || null)}
          aria-label="Filtrar por eixo de obras"
          style={{
            minWidth: '190px',
            maxWidth: '280px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            background: '#fff',
            color: '#334155',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          <option value="">Todos os Eixos</option>
          {allEixos.map((eixo) => {
            const icon = EIXO_ICONS[eixo] || '🏗️';
            const label = EIXO_LABELS[eixo] || eixo;
            return (
              <option key={eixo} value={eixo}>
                {icon} {label}
              </option>
            );
          })}
        </select>

        {/* Espaçador flexível */}
        <div style={{ flex: 1 }} />

        {/* Filtro de Município */}
        <select
          value={municipioSelected}
          onChange={(e) => setMunicipioSelected(e.target.value)}
          aria-label="Filtrar por município"
          style={{
            minWidth: '190px',
            maxWidth: '280px',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid #cbd5e1',
            background: '#fff',
            color: '#475569',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            flex: 1
          }}
        >
          <option value="todos">Todos os Municípios (217)</option>
          {[...municipios].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR')).map((m) => (
            <option key={m.ibge || m.id} value={m.ibge || m.id}>{m.nome}</option>
          ))}
        </select>
      </div>

      {/* Detalhamento das Obras do Município Selecionado */}
      {municipioSelected !== 'todos' && (() => {
        const munDetalhe = listaExibicao.find(m => String(m.ibge || m.id) === String(municipioSelected));
        const obrasMun = (munDetalhe?.eixos && Array.isArray(munDetalhe.eixos)) ? munDetalhe.eixos : [];
        if (!munDetalhe) return null;
        return (
          <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ fontSize: '15px', color: '#0b3c5d', margin: 0 }}>🏗️ Detalhamento das Obras — {munDetalhe.nome}</h3>
              <span style={{ fontSize: '12px', color: '#7a8a99', fontWeight: 600 }}>{obrasMun.length} obra(s) cadastrada(s)</span>
            </div>
            {obrasMun.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Nenhuma obra detalhada cadastrada para este município.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                {obrasMun.map((obra, idx) => {
                  const status = obra.status || '—';
                  const pct = typeof obra.pct === 'number' ? obra.pct : 0;
                  return (
                    <div key={idx} style={{
                      background: '#fbfdff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#fb3b2d', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Obra Nº {idx + 1}</div>
                      <div className="obra-campo"><span className="obra-label">Objeto:</span><span className="obra-valor">{obra.desc || '—'}</span></div>
                      <div className="obra-campo"><span className="obra-label">Situação:</span><span className="obra-valor">{status} ({pct}%)</span></div>
                      <div className="obra-campo"><span className="obra-label">Fonte:</span><span className="obra-valor">{obra.orgao || '—'} · PLANNER SEGOV</span></div>
                      <div className="obra-campo"><span className="obra-label">Previsão de conclusão:</span><span className="obra-valor">{previsaoConclusao(obra)}</span></div>
                      <div className="obra-campo"><span className="obra-label">Observação:</span><span className="obra-valor">Orçamento: {formatCurrency(obra.orcamento || 0)}</span></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Charts Grid */}
      <div className="dashboard-charts-grid">
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>🏗️ Obras por Situação</h3>
          <ChartSituacao municipios={listaExibicao} />
        </div>
        <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
          <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>🏗️ Eixos de Investimento</h3>
          <ChartEixos municipios={listaExibicao} />
        </div>
      </div>
    </div>
  );
}
