import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { LABELS } from '../data/municipios';
const REGIOES = ['Centro Maranhense', 'Leste Maranhense', 'Norte Maranhense', 'Oeste Maranhense', 'Sul Maranhense'];
export function FiltrosGlobais() {
  const [aberto, setAberto] = useState(false);
  const { grupo, setGrupo, busca, setBusca, mesorregiao, setMesorregiao, resetFiltros, municipios, getMunicipiosFiltrados } = useStore();
  const ativos = Number(grupo !== 'todos') + Number(!!mesorregiao) + Number(!!busca);
  return <section className="global-filters" aria-label="Filtros de municípios">
    <div className="filter-toolbar">
      <label className="search-field"><Search size={18} aria-hidden="true" />
        <input aria-label="Buscar município ou prefeito" placeholder="Buscar município ou prefeito" value={busca} onChange={e => setBusca(e.target.value)} />
        {busca && <button aria-label="Limpar busca" onClick={() => setBusca('')}><X size={16} /></button>}
      </label>
      <button className="filter-toggle" aria-expanded={aberto} aria-controls="filter-options" onClick={() => setAberto(!aberto)}><SlidersHorizontal size={18} /> Filtros{ativos > 0 && ` (${ativos})`}</button>
    </div>
    <div id="filter-options" className={`filter-options ${aberto ? 'is-open' : ''}`}>
      <fieldset className="group-filter"><legend>Grupo político</legend><div className="filter-pills">
        {['todos', ...Object.keys(LABELS)].map(value => <button key={value} aria-pressed={grupo === value} onClick={() => setGrupo(value)}>{LABELS[value] || 'Todos'}</button>)}
      </div></fieldset>
      <label className="region-filter">Mesorregião<select value={mesorregiao || 'todas'} onChange={e => setMesorregiao(e.target.value)}><option value="todas">Todas as regiões</option>{REGIOES.map(regiao => <option key={regiao}>{regiao}</option>)}</select></label>
    </div>
    <div className="filter-summary"><span aria-live="polite">{getMunicipiosFiltrados().length} de {municipios.length} municípios</span>
      {grupo !== 'todos' && <button className="filter-chip" onClick={() => setGrupo('todos')} aria-label={`Remover filtro ${LABELS[grupo]}`}>{LABELS[grupo]} <X size={13} /></button>}
      {mesorregiao && <button className="filter-chip" onClick={() => setMesorregiao(null)} aria-label="Remover filtro de mesorregião">{mesorregiao} <X size={13} /></button>}
      {ativos > 0 && <button className="text-button" onClick={resetFiltros}>Limpar tudo</button>}
    </div>
  </section>;
}
