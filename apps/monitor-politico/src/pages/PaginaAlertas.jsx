import { useMemo } from 'react';
import { AlertTriangle, ShieldAlert, PauseCircle, UserX, Flag } from 'lucide-react';
import { Filtros } from '../components/Filtros';
import { Card, KPI, BadgeGrupo, Barra, Vazio, corRisco } from '../components/UI';
import { useMunicipiosFiltrados, useStore } from '../lib/store';
import { numero, moedaCompacta, pct } from '../lib/dados';

/** Regras de alerta aplicadas sobre o recorte atual. */
const REGRAS = [
  {
    id: 'oposicao-estrategico',
    titulo: 'Oposição em município estratégico',
    descricao: 'Municípios prioritários hoje alinhados à oposição — risco alto de perda de base.',
    icone: Flag,
    cor: 'var(--braide)',
    teste: (m) => m.grupo === 'Braide' && (m.prioritario || m.flagEstrategico),
  },
  {
    id: 'indefinido-carteira',
    titulo: 'Indefinidos com carteira relevante',
    descricao: 'Sem alinhamento declarado, porém com investimento em curso — janela de conversão.',
    icone: ShieldAlert,
    cor: 'var(--alerta)',
    teste: (m) => (m.grupo === 'indefinido' || m.grupo === 'neutro') && m.investimento > 0,
  },
  {
    id: 'obras-paradas',
    titulo: 'Obras paradas ou pendentes',
    descricao: 'Execução travada gera desgaste político direto na base local.',
    icone: PauseCircle,
    cor: 'var(--perigo)',
    teste: (m) => m.obrasParadas > 0,
  },
  {
    id: 'sem-lideranca',
    titulo: 'Território sem lideranças mapeadas',
    descricao: 'Municípios com obras em curso, mas nenhuma liderança identificada na base.',
    icone: UserX,
    cor: 'var(--indefinido)',
    teste: (m) => m.totalLiderancas === 0 && m.totalObras > 0,
  },
  {
    id: 'baixa-entrega',
    titulo: 'Baixa taxa de entrega',
    descricao: 'Menos de 15% das obras entregues em municípios com carteira significativa.',
    icone: AlertTriangle,
    cor: 'var(--alerta)',
    teste: (m) => m.totalObras >= 10 && m.taxaEntrega < 0.15,
  },
];

export function PaginaAlertas() {
  const lista = useMunicipiosFiltrados();
  const selecionar = useStore((s) => s.setMunicipioSelecionado);

  const alertas = useMemo(
    () => REGRAS.map((r) => ({ ...r, municipios: lista.filter(r.teste).sort((a, b) => b.risco - a.risco) })),
    [lista],
  );

  const criticos = useMemo(() => lista.filter((m) => m.risco >= 65).sort((a, b) => b.risco - a.risco), [lista]);
  const atencao = useMemo(() => lista.filter((m) => m.risco >= 40 && m.risco < 65).length, [lista]);
  const totalAlertas = alertas.reduce((s, a) => s + a.municipios.length, 0);

  return (
    <div className="pagina">
      <Filtros />

      <div className="kpis">
        <KPI rotulo="Risco crítico" valor={numero(criticos.length)} nota="Índice ≥ 65 pontos" cor="var(--perigo)" icone={ShieldAlert} />
        <KPI rotulo="Em atenção" valor={numero(atencao)} nota="Índice entre 40 e 64" cor="var(--alerta)" icone={AlertTriangle} />
        <KPI rotulo="Alertas disparados" valor={numero(totalAlertas)} nota={`${REGRAS.length} regras monitoradas`} cor="var(--primaria)" icone={Flag} />
        <KPI
          rotulo="Cobertura do recorte"
          valor={pct(lista.length ? (criticos.length / lista.length) * 100 : 0)}
          nota="Parcela do território em risco crítico"
          cor="var(--acento)"
          icone={PauseCircle}
        />
      </div>

      <Card titulo="Prioridade máxima" descricao="Municípios com índice de atenção igual ou superior a 65">
        {!criticos.length ? (
          <Vazio>Nenhum município em risco crítico neste recorte.</Vazio>
        ) : (
          <div className="grid-3">
            {criticos.slice(0, 12).map((m) => (
              <button key={m.ibge} onClick={() => selecionar(m.ibge)} style={{ all: 'unset', cursor: 'pointer' }}>
                <div
                  className="col"
                  style={{ gap: 8, padding: 13, border: '1px solid var(--borda)', borderRadius: 'var(--raio-s)', background: 'var(--superficie-2)' }}
                >
                  <div className="entre">
                    <strong style={{ fontSize: 14 }}>{m.nome}</strong>
                    <strong style={{ color: corRisco(m.risco) }}>{m.risco}</strong>
                  </div>
                  <Barra valor={m.risco} cor={corRisco(m.risco)} />
                  <div className="linha" style={{ flexWrap: 'wrap' }}>
                    <BadgeGrupo grupo={m.grupo} />
                    <span className="mini">{numero(m.totalObras)} obras · {numero(m.totalLiderancas)} lideranças</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <div className="pilha">
        {alertas.map((a) => (
          <Card
            key={a.id}
            titulo={a.titulo}
            descricao={a.descricao}
            acao={
              <span className="badge" style={{ background: `${a.cor}1a`, color: a.cor, fontSize: 12 }}>
                <a.icone size={12} /> {a.municipios.length}
              </span>
            }
            corpoClass={a.municipios.length ? 'tabela-wrap' : ''}
          >
            {!a.municipios.length ? (
              <Vazio>Nenhuma ocorrência neste recorte. </Vazio>
            ) : (
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Município</th>
                    <th>Grupo</th>
                    <th>Prefeito(a)</th>
                    <th className="num">Obras</th>
                    <th className="num">Paradas</th>
                    <th className="num">Lideranças</th>
                    <th className="num">Investimento</th>
                    <th className="num">Risco</th>
                  </tr>
                </thead>
                <tbody>
                  {a.municipios.slice(0, 15).map((m) => (
                    <tr key={m.ibge} onClick={() => selecionar(m.ibge)}>
                      <td className="td-forte">{m.nome}</td>
                      <td><BadgeGrupo grupo={m.grupo} /></td>
                      <td>{m.prefeito || '—'}</td>
                      <td className="num">{numero(m.totalObras)}</td>
                      <td className="num">{numero(m.obrasParadas)}</td>
                      <td className="num">{numero(m.totalLiderancas)}</td>
                      <td className="num">{m.investimento > 0 ? moedaCompacta(m.investimento) : '—'}</td>
                      <td className="num" style={{ color: corRisco(m.risco), fontWeight: 700 }}>{m.risco}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
