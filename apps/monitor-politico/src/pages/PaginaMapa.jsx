import { useMemo } from 'react';
import { Filtros } from '../components/Filtros';
import { MapaPolitico } from '../components/MapaPolitico';
import { Card, BadgeGrupo } from '../components/UI';
import { useMunicipiosFiltrados, useStore } from '../lib/store';
import { ORDEM_GRUPOS, corDoGrupo, labelDoGrupo, calcularIndicadores, numero, pct, moedaCompacta } from '../lib/dados';

export function PaginaMapa() {
  const lista = useMunicipiosFiltrados();
  const selecionar = useStore((s) => s.setMunicipioSelecionado);
  const ind = useMemo(() => calcularIndicadores(lista), [lista]);

  const destaques = useMemo(
    () => [...lista].filter((m) => m.prioritario || m.flagEstrategico).slice(0, 12),
    [lista],
  );

  return (
    <div className="pagina">
      <Filtros />

      <div className="grid-mapa">
        <MapaPolitico visiveis={lista} />

        <div className="pilha">
          <Card titulo="Legenda" descricao="Clique em um município no mapa para ver o dossiê">
            <div className="legenda">
              {ORDEM_GRUPOS.map((g) => (
                <div key={g} className="legenda__item">
                  <span className="legenda__cor" style={{ background: corDoGrupo(g) }} />
                  <span style={{ flex: 1 }}>{labelDoGrupo(g)}</span>
                  <strong>{numero(ind.porGrupo[g])}</strong>
                  <span className="mini">{pct(ind.pctGrupo[g], 0)}</span>
                </div>
              ))}
              <div className="legenda__item" style={{ borderTop: '1px solid var(--borda)', paddingTop: 9 }}>
                <span className="legenda__cor" style={{ background: '#cbd5e1', opacity: .3 }} />
                <span style={{ flex: 1 }}>Fora do filtro atual</span>
              </div>
            </div>
          </Card>

          <Card titulo="Resumo do recorte">
            <div className="pilha">
              <div className="entre"><span className="mini">Municípios visíveis</span><strong>{numero(ind.total)}</strong></div>
              <div className="entre"><span className="mini">Lideranças</span><strong>{numero(ind.liderancas)}</strong></div>
              <div className="entre"><span className="mini">Obras</span><strong>{numero(ind.obras)}</strong></div>
              <div className="entre"><span className="mini">Investimento</span><strong>{moedaCompacta(ind.investimento)}</strong></div>
            </div>
          </Card>

          {destaques.length > 0 && (
            <Card titulo="Municípios estratégicos" descricao="Atenção prioritária no recorte">
              <div className="pilha rolagem">
                {destaques.map((m) => (
                  <button key={m.ibge} onClick={() => selecionar(m.ibge)} style={{ all: 'unset', cursor: 'pointer' }}>
                    <div className="entre" style={{ padding: '6px 0', borderBottom: '1px solid var(--borda)' }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{m.nome}</span>
                      <BadgeGrupo grupo={m.grupo} />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
