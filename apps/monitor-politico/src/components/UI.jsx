import { GRUPOS, corDoGrupo, labelDoGrupo } from '../lib/dados';

export function Card({ titulo, descricao, acao, children, corpoClass = '' }) {
  return (
    <section className="card">
      {(titulo || acao) && (
        <header className="card__cabecalho">
          <div className="col" style={{ flex: 1, minWidth: 0 }}>
            {titulo && <span className="card__titulo">{titulo}</span>}
            {descricao && <span className="card__desc">{descricao}</span>}
          </div>
          {acao}
        </header>
      )}
      <div className={`card__corpo ${corpoClass}`}>{children}</div>
    </section>
  );
}

export function KPI({ rotulo, valor, nota, cor = 'var(--primaria)', icone: Icone }) {
  return (
    <article className="kpi" style={{ '--cor': cor }}>
      <div className="kpi__topo">
        <span className="kpi__rotulo">{rotulo}</span>
        {Icone && (
          <span className="kpi__icone">
            <Icone size={17} />
          </span>
        )}
      </div>
      <span className="kpi__valor">{valor}</span>
      {nota && <span className="kpi__nota">{nota}</span>}
    </article>
  );
}

export function BadgeGrupo({ grupo }) {
  const cor = corDoGrupo(grupo);
  const g = GRUPOS[grupo] || GRUPOS.indefinido;
  return (
    <span
      className="badge"
      style={{ background: g.suave, color: cor, borderColor: `${cor}33` }}
    >
      <span className="ponto" style={{ background: cor }} />
      {labelDoGrupo(grupo)}
    </span>
  );
}

export function Barra({ valor, max = 100, cor = 'var(--primaria)' }) {
  const p = max > 0 ? Math.min(100, (valor / max) * 100) : 0;
  return (
    <div className="barra" title={`${p.toFixed(0)}%`}>
      <div className="barra__fill" style={{ width: `${p}%`, background: cor }} />
    </div>
  );
}

export function Vazio({ children = 'Nenhum resultado para os filtros aplicados.' }) {
  return <div className="vazio">{children}</div>;
}

export function corRisco(risco) {
  if (risco >= 65) return 'var(--perigo)';
  if (risco >= 40) return 'var(--alerta)';
  return 'var(--ok)';
}
