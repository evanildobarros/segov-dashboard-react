import { useState, useMemo, useCallback, useEffect } from 'react';
import { formatCurrency, normalizeString, LABELS } from '../data/municipios';
import { enriquecerMunicipios, previsaoConclusao } from '../utils/obrasEnrich';
import { Download, Search, X } from 'lucide-react';

export function TabelaObras({ municipios: municipiosRaw }) {
  // D1 só traz `eixos` p/ 52 municípios — completamos com o PLANNER local (217 muns)
  const municipios = useMemo(() => enriquecerMunicipios(municipiosRaw), [municipiosRaw]);
  const [pagina, setPagina] = useState(1);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState('todos');
  const [filtroEixo, setFiltroEixo] = useState('todos');
  
  const [obraDetalhe, setObraDetalhe] = useState(null);

  const PAGE_SIZE = 50;

  // ========== LISTAS ÚNICAS DE VALORES (geradas a partir dos dados) ==========
  const listaMunicipiosUnicos = useMemo(() => {
    const seen = new Set();
    return (municipios || []).filter(mun => {
      if (seen.has(mun.nome)) return false;
      seen.add(mun.nome);
      return true;
    }).sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  }, [municipios]);

  const listaEixosUnicos = useMemo(() => {
    return (municipios || []).flatMap(mun => {
      const eixos = mun?.eixos && Array.isArray(mun.eixos) ? mun.eixos : [];
      return eixos.map(e => e.orgao).filter(Boolean);
    }).reduce((acc, orgao) => {
      if (!acc.includes(orgao)) acc.push(orgao);
      return acc;
    }, []).sort();
  }, [municipios]);


  // ========== OPÇÕES DOS SELECTS ==========
  const OPCOES_STATUS = [
    { value: 'todos', label: '📋 Todas Situações' },
    { value: 'entregues', label: '✅ Entregue / Concluída / Inaugurada' },
    { value: 'andamento', label: '🔄 Em Andamento / Mobilização' },
    { value: 'paralisadas', label: '⛔ Paralisada / Parada' },
    { value: 'nao_iniciadas', label: '⏳ Não Iniciada / Planejamento' },
    { value: 'aguardar', label: '⏳ Aguardar' },
    { value: 'projeto', label: '📋 Projeto e Orçamento' },
    { value: 'aprovacao', label: '📝 Aprovação' },
    { value: 'pendente', label: '⏳ Pendente de Informações' },
    { value: 'visita', label: '👁️ Visita Técnica' },
    { value: 'deliberacao', label: 'ℹ️ Deliberação Gov.' },
    { value: 'relatorio', label: '📄 Relatório' },
  ];


  const OPCOES_EIXOS = [
    { value: 'todos', label: '📋 Todos os Eixos' },
    ...listaEixosUnicos.map(eixo => ({ value: eixo, label: eixo })),
  ];

  const OPCOES_MUNICIPIOS = [
    { value: 'todos', label: '📋 Todos os Municípios' },
    ...listaMunicipiosUnicos.map(m => ({ value: m.nome, label: m.nome })),
  ];

  // ========== BADGES & MATCHERS ==========
  const STATUS_BADGES = {
    CONCLUIDA: { label: 'Entregue', color: '#10b981', bg: '#ecfdf5' },
    ANDAMENTO: { label: 'Em Andamento', color: '#3b82f6', bg: '#bfdbfe' },
    PARALISA: { label: 'Paralisada', color: '#ef4444', bg: '#fef2f2' },
    NAO_INICIADA: { label: 'Não Iniciada', color: 'var(--texto-secundario)', bg: '#f1f5f9' },
  };

  function getBadge(status) {
    const upper = (status || '').toUpperCase();
    if (/CONCLU|ENTREGUE|INAUGURADA/.test(upper)) return STATUS_BADGES.CONCLUIDA;
    if (/EXECU|ANDAMENTO|MOBILIZA/.test(upper)) return STATUS_BADGES.ANDAMENTO;
    if (/PARALISADA|PARADA|SUSPENSA/.test(upper)) return STATUS_BADGES.PARALISA;
    return STATUS_BADGES.NAO_INICIADA;
  }

  function matchFilter(valor, filtro) {
    if (filtro === 'todos') return true;
    const valorNormalizado = normalizeString(valor);
    const filtroNormalizado = normalizeString(filtro);
    return valorNormalizado === filtroNormalizado;
  }

  function matchStatusFilter(o, filtro) {
    if (filtro === 'todos') return true;
    const upper = (o.status || '').toUpperCase();
    const pct = typeof o.pct === 'number' ? o.pct : 0;
    if (filtro === 'entregues') return /CONCLU|ENTREGUE|INAUGURADA/.test(upper) || pct >= 100;
    if (filtro === 'andamento') return (/EXECU|ANDAMENTO|MOBILIZA/.test(upper) || (pct > 0 && pct < 100)) && !/PARADA|PARALISADA|SUSPENSA/.test(upper);
    if (filtro === 'paralisadas') return /PARALISADA|PARADA|SUSPENSA/.test(upper);
    if (filtro === 'nao_iniciadas') {
      const isConcluida = /CONCLU|ENTREGUE|INAUGURADA/.test(upper) || pct >= 100;
      const isAndamento = (/EXECU|ANDAMENTO|MOBILIZA/.test(upper) || (pct > 0 && pct < 100)) && !/PARADA|PARALISADA|SUSPENSA/.test(upper);
      const isParada = /PARALISADA|PARADA|SUSPENSA/.test(upper);
      return !isConcluida && !isAndamento && !isParada;
    }
    if (filtro === 'aguardar') return /AGUARDAR/.test(upper);
    if (filtro === 'projeto') return /PROJETO E ORÇAMENTO/.test(upper);
    if (filtro === 'aprovacao') return /APROVA(Ç|C)/.test(upper) || /AG\./.test(upper);
    if (filtro === 'pendente') return /PEND/.test(upper);
    if (filtro === 'visita') return /VISITA TÉCNICA/.test(upper);
    if (filtro === 'deliberacao') return /DELIBERAÇÃO GAB/.test(upper);
    if (filtro === 'relatorio') return /RELATÓRIO/.test(upper);
    return true;
  }

  // ========== DADOS BRUTOS ==========
  const todasObras = useMemo(() => {
    const result = [];
    (municipios || []).forEach(mun => {
      const eixos = mun?.eixos && Array.isArray(mun.eixos) ? mun.eixos : [];
      eixos.forEach((obra, idx) => {
        result.push({
          id: `${mun.ibge}-${idx}`,
          municipio: mun.nome,
          ibge: mun.ibge,
          grupo: mun.grupo,
          prefeito: mun.prefeito,
          eixo: obra.orgao || '—',
          sei: obra.sei || '',
          objeto: obra.desc || obra.objeto || '—',
          status: obra.status || '—',
          pct: typeof obra.pct === 'number' ? obra.pct : 0,
          orcamento: obra.orcamento || 0,
          investimento: mun.investimento_planner,
        });
      });
    });
    return result;
  }, [municipios]);

  // ========== FILTRAGEM COMBINADA ==========
  const filtered = useMemo(() => {
    let resultado = todasObras;

    // Busca por texto livre
    const q = normalizeString(busca).trim();
    if (q) {
      resultado = resultado.filter(o =>
        normalizeString(o.municipio).includes(q) ||
        normalizeString(o.objeto).includes(q) ||
        normalizeString(o.eixo).includes(q) ||
        normalizeString(o.status).includes(q) ||
        normalizeString(o.grupo).includes(q)
      );
    }

    // Filtros por select
    resultado = resultado.filter(o =>
      matchFilter(o.municipio, filtroMunicipio) &&
      matchFilter(o.eixo, filtroEixo) &&
      matchStatusFilter(o, filtroStatus)
    );

    return resultado;
  }, [todasObras, busca, filtroStatus, filtroMunicipio, filtroEixo]);

  // ========== ORDENAÇÃO POR COLUNA ==========
  const [sortKey, setSortKey] = useState('municipio');
  const [sortDir, setSortDir] = useState('asc');

  const handleColumnClick = useCallback((key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = String(a[sortKey] || '').toLowerCase();
      const bv = String(b[sortKey] || '').toLowerCase();
      const cmp = av.localeCompare(bv, 'pt-BR', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginaAtual = Math.min(pagina, pages);
  const start = (paginaAtual - 1) * PAGE_SIZE;
  const pagAtual = sorted.slice(start, start + PAGE_SIZE);

  // Reset page when any filter changes
  const onFilterChange = useCallback((setter) => (e) => {
    setter(e.target.value);
    setPagina(1);
  }, []);

  // ESC fecha o modal de detalhes
  useEffect(() => {
    if (!obraDetalhe) return;
    const onKey = (e) => { if (e.key === 'Escape') setObraDetalhe(null); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [obraDetalhe]);

  // Count active filters
  const filtrosAtivos = [filtroStatus, filtroMunicipio, filtroEixo].filter(f => f !== 'todos').length;
  const labelFiltroStatus = OPCOES_STATUS.find(o => o.value === filtroStatus)?.label || '';
  const labelFiltroEixo = OPCOES_EIXOS.find(o => o.value === filtroEixo)?.label || '';
  const labelFiltroMunicipio = OPCOES_MUNICIPIOS.find(o => o.value === filtroMunicipio)?.label || '';

  const exportCSV = () => {
    const csv = sorted.map(o => ({
      Municipio: o.municipio,
      Grupo: o.grupo,
      Eixo: o.eixo,
      SEI: o.sei,
      Objeto: o.objeto,
      Situacao: o.status,
      Pct: o.pct,
      Orcamento: o.orcamento,
    }));
    const header = Object.keys(csv[0] || {}).join(';');
    const rows = csv.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';'));
    const blob = new Blob([`\uFEFF${header}\r\n${rows.join('\r\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'obras_segov.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAllFilters = () => {
    setFiltroStatus('todos');
    setFiltroMunicipio('todos');
    setFiltroEixo('todos');
    setBusca('');
    setPagina(1);
  };

  // Colunas da tabela com ordenação
  const colunas = [
    { key: 'municipio', label: 'Município' },
    { key: 'grupo', label: 'Grupo' },
    { key: 'eixo', label: 'Eixo' },
    { key: 'sei', label: 'Nº SEI' },
    { key: 'objeto', label: 'Objeto' },
    { key: 'status', label: 'Situação', align: 'center' },
    { key: 'orcamento', label: 'Orçamento', align: 'right' },
    { key: 'detalhes', label: '', align: 'center', noSort: true },
  ];

  return (
    <div className="tabela-obras-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* ===== ROW 1: BUSCA + SELETS EM GRID ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '8px',
        alignItems: 'center'
      }}>
        {/* Busca */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            aria-label="Buscar descrição da obra" placeholder="Buscar descrição da obra"
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            style={{
              width: '100%', padding: '7px 32px 7px 10px', fontSize: '12px',
              border: '1px solid var(--borda)', borderRadius: '6px', color: 'var(--texto)', outline: 'none'
            }}
          />
          <Search size={14} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-secundario)' }} />
        </div>

        {/* Select Município */}
        <select aria-label="Município da obra" value={filtroMunicipio} onChange={onFilterChange(setFiltroMunicipio)} style={selectStyle}>
          {OPCOES_MUNICIPIOS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>

        {/* Select Eixo */}
        <select aria-label="Eixo da obra" value={filtroEixo} onChange={onFilterChange(setFiltroEixo)} style={selectStyle}>
          {OPCOES_EIXOS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>

        {/* Select Situação */}
        <select aria-label="Situação da obra" value={filtroStatus} onChange={onFilterChange(setFiltroStatus)} style={selectStyle}>
          {OPCOES_STATUS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
        </select>

        {/* Botões Exportar / Limpar */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={resetAllFilters} style={btnSmallStyle}>↺ Limpar</button>
          <button onClick={exportCSV} style={{ ...btnSmallStyle, color: 'var(--heading)' }}>
            <Download size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '2px' }} /> CSV
          </button>
        </div>
      </div>

      {/* ===== ROW 2: INFO + CONTADOR ===== */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '11px', color: 'var(--texto-secundario)', fontWeight: 600, flexWrap: 'wrap', gap: '8px'
      }}>
        <span>{pagAtual.length} de {sorted.length} obra(s)</span>
        {filtrosAtivos > 0 && (
          <span style={{ background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '4px' }}>
            {filtrosAtivos} filtro(s) ativo(s)
          </span>
        )}
      </div>

      {(filtrosAtivos > 0 || busca) && <div className="filter-summary" aria-live="polite">
        {filtroStatus !== 'todos' && <span className="filter-chip">{labelFiltroStatus}</span>}
        {filtroEixo !== 'todos' && <span className="filter-chip">{labelFiltroEixo}</span>}
        {filtroMunicipio !== 'todos' && <span className="filter-chip">{labelFiltroMunicipio}</span>}
        {busca && <span className="filter-chip">Descrição: {busca}</span>}
      </div>}
      {/* ===== TABLE ===== */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-muted)', borderBottom: '2px solid var(--borda)' }}>
              {colunas.map(col => (
                <th
                  key={col.key}
                  onClick={col.noSort ? undefined : () => handleColumnClick(col.key)}
                  style={{
                    padding: '8px 12px',
                    textAlign: col.align || 'left',
                    color: 'var(--texto)',
                    fontWeight: 600,
                    cursor: col.noSort ? 'default' : 'pointer',
                    borderBottom: '1px solid var(--borda)',
                    userSelect: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col.label}
                  {sortKey === col.key && <span style={{ marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagAtual.length === 0 ? (
              <tr>
                <td colSpan={colunas.length} style={{ padding: '24px', textAlign: 'center', color: 'var(--texto-secundario)' }}>
                  Nenhuma obra encontrada para os filtros atuais.
                </td>
              </tr>
            ) : (
              pagAtual.map(o => {
                const badge = getBadge(o.status);
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--borda)' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--heading)', fontWeight: 600 }}>{o.municipio}</td>
                    <td style={{ padding: '8px 12px' }}>{LABELS[o.grupo] || o.grupo}</td>
                    <td style={{ padding: '8px 12px' }}>{o.eixo}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: '11px', whiteSpace: 'nowrap', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--texto-secundario)' }} title={o.sei || ''}>{o.sei || '—'}</td>
                    <td style={{ padding: '8px 12px', maxWidth: '360px', minWidth: '210px', whiteSpace: 'normal', lineHeight: 1.5 }} title={o.objeto}>{o.objeto}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 8px', borderRadius: '4px',
                        fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                        color: badge.color, background: badge.bg
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(o.orcamento)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => setObraDetalhe(o)}
                        title="Ver detalhes da obra"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '4px 10px', fontSize: '11px', fontWeight: 600,
                          color: 'var(--heading)', background: '#eff6ff',
                          border: '1px solid #bfdbfe', borderRadius: '6px',
                          cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                      >
                        🔍 Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINATION ===== */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '12px', color: 'var(--texto-secundario)'
      }}>
        <span>Página {paginaAtual} de {pages || 1}</span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setPagina(p => Math.max(1, Math.min(p, pages) - 1))} aria-label="Página anterior" disabled={paginaAtual === 1} style={paginationBtn}>
            ←
          </button>
          <button onClick={() => setPagina(p => Math.min(pages, Math.min(p, pages) + 1))} aria-label="Próxima página" disabled={paginaAtual >= pages} style={paginationBtn}>
            →
          </button>
        </div>
      </div>

      {/* ===== MODAL DETALHES DA OBRA ===== */}
      {obraDetalhe && (
        <div
          onClick={() => setObraDetalhe(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(11, 60, 93, 0.55)', backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Detalhes da obra — ${obraDetalhe.municipio}`}
            style={{
              background: 'var(--bg-card)', borderRadius: '14px', width: '100%', maxWidth: '560px',
              maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            {/* Header */}
            <div style={{
              position: 'sticky', top: 0, background: '#0b3c5d', color: '#fff',
              padding: '14px 18px', display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', gap: '10px', borderTopLeftRadius: '14px', borderTopRightRadius: '14px'
            }}>
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.85, marginBottom: '3px' }}>
                  🏗️ Detalhes da Obra — PLANNER SEGOV
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.3 }}>{obraDetalhe.objeto}</div>
              </div>
              <button
                onClick={() => setObraDetalhe(null)}
                aria-label="Fechar"
                style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', borderRadius: '8px', padding: '6px', lineHeight: 0, flexShrink: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Corpo */}
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="obra-campo"><span className="obra-label">Município:</span> <span className="obra-valor" style={{ fontWeight: 700, color: 'var(--heading)' }}>{obraDetalhe.municipio}</span></div>
              <div className="obra-campo"><span className="obra-label">Grupo político:</span> <span className="obra-valor">
                {obraDetalhe.grupo === 'Brandão' ? '🔵' : obraDetalhe.grupo === 'Braide' ? '🟠' : '⚪'} {obraDetalhe.grupo || '—'}
              </span></div>
              <div className="obra-campo"><span className="obra-label">Prefeito:</span> <span className="obra-valor">{obraDetalhe.prefeito || '—'}</span></div>
              <div className="obra-campo"><span className="obra-label">Eixo:</span> <span className="obra-valor">{obraDetalhe.eixo}</span></div>
              <div className="obra-campo"><span className="obra-label">Nº SEI:</span> <span className="obra-valor" style={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }}>{obraDetalhe.sei || '—'}</span></div>
              <div style={{ borderTop: '1px dashed #e2e8f0' }} />
              <div className="obra-campo"><span className="obra-label">Situação:</span> <span className="obra-valor">{(() => { const b = getBadge(obraDetalhe.status); return (
                <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: '4px', fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: b.color, background: b.bg }}>{b.label}</span>
              ); })()} · {(obraDetalhe.status || '—')} ({obraDetalhe.pct ?? 0}%)</span></div>
              <div className="obra-campo"><span className="obra-label">Orçamento:</span> <span className="obra-valor" style={{ fontWeight: 700 }}>{formatCurrency(obraDetalhe.orcamento)}</span></div>
              <div className="obra-campo"><span className="obra-label">Previsão de conclusão:</span> <span className="obra-valor">{previsaoConclusao(obraDetalhe)}</span></div>
              <div className="obra-campo"><span className="obra-label">Fonte:</span> <span className="obra-valor">PLANNER SEGOV</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========== STYLES REUTILIZÁVEIS ==========
const selectStyle = {
  padding: '6px 10px', fontSize: '12px', fontWeight: 600,
  border: '1px solid var(--borda)', borderRadius: '6px',
  color: 'var(--texto)', background: 'var(--bg-card)', cursor: 'pointer', outline: 'none', minWidth: '0',
};

const btnSmallStyle = {
  display: 'flex', alignItems: 'center', gap: '4px',
  padding: '6px 12px', fontSize: '11px', fontWeight: 600,
  color: 'var(--texto-secundario)', border: '1px solid var(--borda)',
  borderRadius: '6px', cursor: 'pointer', background: 'var(--bg-card)', whiteSpace: 'nowrap',
};

const paginationBtn = {
  padding: '4px 10px', border: '1px solid var(--borda)', borderRadius: '4px',
  background: 'var(--bg-card)', cursor: 'pointer', fontSize: '12px', color: 'var(--texto)',
};
