import { useMemo } from 'react';
import { Printer } from 'lucide-react';
import { Filtros } from '../components/Filtros';
import { Card, BadgeGrupo, Barra, corRisco } from '../components/UI';
import { useMunicipiosFiltrados } from '../lib/store';
import {
  calcularIndicadores, agruparPorMesorregiao, ORDEM_GRUPOS, labelDoGrupo, corDoGrupo,
  numero, moeda, moedaCompacta, pct, METADATA,
} from '../lib/dados';

export function PaginaRelatorio() {
  const lista = useMunicipiosFiltrados();
  const ind = useMemo(() => calcularIndicadores(lista), [lista]);
  const regioes = useMemo(() => agruparPorMesorregiao(lista), [lista]);
  const criticos = useMemo(() => [...lista].sort((a, b) => b.risco - a.risco).slice(0, 10), [lista]);

  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="pagina">
      <Filtros />

      <Card
        titulo="Relatório executivo"
        descricao={`Gerado em ${hoje} · recorte com ${numero(ind.total)} municípios`}
        acao={
          <button className="botao botao--primario" onClick={() => window.print()}>
            <Printer size={14} /> Imprimir / PDF
          </button>
        }
      >
        <div className="pilha" style={{ gap: 18 }}>
          <section className="col" style={{ gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>1. Panorama político</h3>
            <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--texto-2)' }}>
              O recorte analisado abrange <strong>{numero(ind.total)} municípios</strong>, dos quais{' '}
              <strong>{numero(ind.porGrupo['Brandão'])}</strong> ({pct(ind.pctGrupo['Brandão'])}) estão alinhados à
              base do governo e <strong>{numero(ind.porGrupo['Braide'])}</strong> ({pct(ind.pctGrupo['Braide'])}) à
              oposição. Outros <strong>{numero(ind.porGrupo['indefinido'] + ind.porGrupo['neutro'])}</strong>{' '}
              permanecem indefinidos ou neutros, representando o principal espaço de disputa. O índice de domínio
              territorial é de <strong>{ind.indiceDominio.toFixed(1)} pontos</strong>.
            </p>
          </section>

          <section className="col" style={{ gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>2. Composição por grupo</h3>
            <div className="pilha">
              {ORDEM_GRUPOS.map((g) => (
                <div key={g} className="col" style={{ gap: 5 }}>
                  <div className="entre">
                    <span className="linha"><BadgeGrupo grupo={g} /></span>
                    <span className="mini">
                      <strong style={{ color: 'var(--texto)' }}>{numero(ind.porGrupo[g])}</strong> · {pct(ind.pctGrupo[g])}
                    </span>
                  </div>
                  <Barra valor={ind.pctGrupo[g]} cor={corDoGrupo(g)} />
                </div>
              ))}
            </div>
          </section>

          <section className="col" style={{ gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>3. Execução de obras e investimento</h3>
            <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--texto-2)' }}>
              Estão mapeadas <strong>{numero(ind.obras)} obras</strong>, com{' '}
              <strong>{numero(ind.entregues)}</strong> entregues ({pct(ind.taxaEntrega * 100)}) e{' '}
              <strong>{numero(ind.andamento)}</strong> em andamento. O investimento monitorado na carteira detalhada
              soma <strong>{moeda(ind.investimento)}</strong>. A base conta com{' '}
              <strong>{numero(ind.liderancas)} lideranças</strong> mapeadas.
            </p>
          </section>

          <section className="col" style={{ gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>4. Distribuição regional</h3>
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Mesorregião</th>
                    <th className="num">Municípios</th>
                    {ORDEM_GRUPOS.map((g) => <th key={g} className="num">{labelDoGrupo(g)}</th>)}
                    <th className="num">Obras</th>
                    <th className="num">Investimento</th>
                  </tr>
                </thead>
                <tbody>
                  {regioes.map((r) => (
                    <tr key={r.mesorregiao}>
                      <td className="td-forte">{r.mesorregiao}</td>
                      <td className="num">{numero(r.total)}</td>
                      {ORDEM_GRUPOS.map((g) => <td key={g} className="num">{numero(r[g])}</td>)}
                      <td className="num">{numero(r.obras)}</td>
                      <td className="num">{r.investimento > 0 ? moedaCompacta(r.investimento) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="col" style={{ gap: 8 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>5. Municípios que exigem atenção</h3>
            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Município</th>
                    <th>Grupo</th>
                    <th>Prefeito(a)</th>
                    <th className="num">Obras</th>
                    <th className="num">Entregues</th>
                    <th style={{ minWidth: 120 }}>Índice de risco</th>
                  </tr>
                </thead>
                <tbody>
                  {criticos.map((m) => (
                    <tr key={m.ibge}>
                      <td className="td-forte">{m.nome}</td>
                      <td><BadgeGrupo grupo={m.grupo} /></td>
                      <td>{m.prefeito || '—'}</td>
                      <td className="num">{numero(m.totalObras)}</td>
                      <td className="num">{numero(m.obrasEntregues)}</td>
                      <td>
                        <span className="linha" style={{ gap: 8 }}>
                          <Barra valor={m.risco} cor={corRisco(m.risco)} />
                          <strong style={{ color: corRisco(m.risco), fontSize: 12.5 }}>{m.risco}</strong>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="col" style={{ gap: 6 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>6. Nota metodológica</h3>
            <p className="mini" style={{ margin: 0, lineHeight: 1.7 }}>
              O índice de atenção política (0–100) combina alinhamento partidário do município, marcação estratégica,
              taxa de entrega de obras, obras paradas e presença de lideranças mapeadas. Base de dados:{' '}
              {METADATA.fonte || 'pesquisa territorial'} · versão {METADATA.versao || '—'}
              {METADATA.data_pesquisa ? ` · pesquisa de ${METADATA.data_pesquisa}` : ''}.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
