import { Star, RotateCcw } from 'lucide-react';
import { useStore } from '../lib/store';
import { MESORREGIOES, ORDEM_GRUPOS, labelDoGrupo } from '../lib/dados';

export function Filtros({ mostrarOrdenacao = false }) {
  const grupo = useStore((s) => s.grupo);
  const setGrupo = useStore((s) => s.setGrupo);
  const meso = useStore((s) => s.mesorregiao);
  const setMeso = useStore((s) => s.setMesorregiao);
  const prio = useStore((s) => s.somentePrioritarios);
  const togglePrio = useStore((s) => s.togglePrioritarios);
  const ordenacao = useStore((s) => s.ordenacao);
  const setOrdenacao = useStore((s) => s.setOrdenacao);
  const limpar = useStore((s) => s.limparFiltros);

  return (
    <div className="filtros">
      <label className="campo">
        <span className="campo__rotulo">Grupo político</span>
        <select className="controle" value={grupo} onChange={(e) => setGrupo(e.target.value)}>
          <option value="todos">Todos os grupos</option>
          {ORDEM_GRUPOS.map((g) => (
            <option key={g} value={g}>{labelDoGrupo(g)}</option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span className="campo__rotulo">Mesorregião</span>
        <select className="controle" value={meso} onChange={(e) => setMeso(e.target.value)}>
          <option value="todas">Todas as regiões</option>
          {MESORREGIOES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      {mostrarOrdenacao && (
        <label className="campo">
          <span className="campo__rotulo">Ordenar por</span>
          <select className="controle" value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
            <option value="nome">Nome (A–Z)</option>
            <option value="risco">Índice de risco</option>
            <option value="obras">Total de obras</option>
            <option value="investimento">Investimento</option>
            <option value="liderancas">Lideranças</option>
          </select>
        </label>
      )}

      <div className="campo">
        <span className="campo__rotulo">Recorte</span>
        <button className={`chip ${prio ? 'chip--ativo' : ''}`} onClick={togglePrio}>
          <Star size={13} /> Só prioritários
        </button>
      </div>

      <div className="campo" style={{ marginLeft: 'auto' }}>
        <span className="campo__rotulo">&nbsp;</span>
        <button className="botao" onClick={limpar}>
          <RotateCcw size={14} /> Limpar
        </button>
      </div>
    </div>
  );
}
