import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar,
} from 'recharts';
import { Building2, Users, HardHat, Wallet, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { Filtros } from '../components/Filtros';
import { Card, KPI, BadgeGrupo, Barra, Vazio, corRisco } from '../components/UI';
import { useMunicipiosFiltrados, useStore } from '../lib/store';
import {
  calcularIndicadores, agruparPorMesorregiao, ORDEM_GRUPOS, corDoGrupo, labelDoGrupo,
  moedaCompacta, numero, pct,
} from '../lib/dados';

export function VisaoGeral() {
  const lista = useMunicipiosFiltrados();
  const selecionar = useStore((s) => s.setMunicipioSelecionado);
  const navegar = useNavigate();

  const ind = useMemo(() => calcularIndicadores(lista), [lista]);
  const regioes = useMemo(() => agruparPorMesorregiao(lista), [lista]);

  const dadosPizza = ORDEM_GRUPOS
    .map((g) => ({ nome: labelDoGrupo(g), valor: ind.porGrupo[g], cor: corDoGrupo(g) }))
    .filter((d) => d.valor > 0);

  const topRisco = useMemo(() => [...lista].sort((a, b) => b.risco - a.risco).slice(0, 8), [lista]);

  const dominio = [{ nome: 'Domínio', valor: Math.max(0, ind.indiceDominio), fill: 'var(--brandao)' }];

  if (!lista.length) {
    return (
      <div className="pagina">
        <Filtros />
        <Card><Vazio /></Card>
      </div>
    );
  }

  return (
    <div className="pagina">
      <Filtros />

      <div className="kpis">
        <KPI
          rotulo="Municípios"
          valor={numero(ind.total)}
          nota={`${ind.prioritarios} prioritários no recorte`}
          cor="var(--primaria)"
          icone={Building2}
        />
        <KPI
          rotulo="Base alinhada"
          valor={pct(ind.pctGrupo['Brandão'])}
          nota={`${numero(ind.porGrupo['Brandão'])} municípios · oposição ${pct(ind.pctGrupo['Braide'])}`}
          cor="var(--brandao)"
          icone={TrendingUp}
        />
        <KPI
          rotulo="Lideranças"
          valor={numero(ind.liderancas)}
          nota="Mapeadas na base territorial"
          cor="var(--acento)"
          icone={Users}
        />
        <KPI
          rotulo="Obras"
          valor={numero(ind.obras)}
          nota={`${pct(ind.taxaEntrega * 100)} entregues · ${numero(ind.andamento)} em andamento`}
          cor="var(--alerta)"
          icone={HardHat}
        />
        <KPI
          rotulo="Investimento monitorado"
          valor={moedaCompacta(ind.investimento)}
          nota="Carteira detalhada por eixo"
          cor="var(--ok)"
          icone={Wallet}
        />
      </div>

      <div className="grid-2">
        <Card titulo="Distribuição por grupo político" descricao="Participação de cada grupo no recorte atual">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosPizza}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={62}
                  outerRadius={100}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {dadosPizza.map((d) => <Cell key={d.nome} fill={d.cor} />)}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} municípios`, n]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12.5 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card titulo="Composição por mesorregião" descricao="Municípios por grupo em cada região">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regioes} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" vertical={false} />
                <XAxis
                  dataKey="mesorregiao"
                  tickFormatter={(v) => v.replace(' Maranhense', '')}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--superficie-2)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                {ORDEM_GRUPOS.map((g) => (
                  <Bar key={g} dataKey={g} name={labelDoGrupo(g)} stackId="a" fill={corDoGrupo(g)} radius={[0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid-2">
        <Card
          titulo="Radar de atenção"
          descricao="Municípios com maior índice de risco político"
          acao={
            <button className="botao" onClick={() => navegar('/alertas')}>
              Ver todos <ChevronRight size={14} />
            </button>
          }
        >
          <div className="pilha">
            {topRisco.map((m) => (
              <button
                key={m.ibge}
                onClick={() => selecionar(m.ibge)}
                style={{ all: 'unset', cursor: 'pointer' }}
              >
                <div className="entre" style={{ padding: '7px 0', borderBottom: '1px solid var(--borda)' }}>
                  <div className="col" style={{ gap: 3, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 13.5 }}>{m.nome}</span>
                    <div className="linha">
                      <BadgeGrupo grupo={m.grupo} />
                      <span className="mini">{numero(m.totalObras)} obras</span>
                    </div>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end', gap: 5, width: 96 }}>
                    <strong style={{ color: corRisco(m.risco), fontSize: 14 }}>{m.risco}</strong>
                    <Barra valor={m.risco} cor={corRisco(m.risco)} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="pilha">
          <Card titulo="Índice de domínio territorial" descricao="Saldo entre base alinhada e oposição">
            <div style={{ height: 150, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  data={dominio}
                  innerRadius="72%"
                  outerRadius="100%"
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar dataKey="valor" cornerRadius={10} background={{ fill: 'var(--borda)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: 'absolute', inset: 0, top: 32,
                  display: 'grid', placeItems: 'center', pointerEvents: 'none',
                }}
              >
                <div className="col" style={{ alignItems: 'center', gap: 0 }}>
                  <strong style={{ fontSize: 30, letterSpacing: '-1px' }}>{ind.indiceDominio.toFixed(0)}</strong>
                  <span className="mini">de 100 pontos</span>
                </div>
              </div>
            </div>
            <p className="mini" style={{ margin: 0, textAlign: 'center' }}>
              Diferença percentual entre municípios da base e da oposição.
            </p>
          </Card>

          <Card titulo="Execução da carteira" descricao="Situação agregada das obras no recorte">
            <div className="pilha">
              <div className="entre">
                <span className="mini">Obras entregues</span>
                <strong>{numero(ind.entregues)}</strong>
              </div>
              <Barra valor={ind.entregues} max={ind.obras || 1} cor="var(--ok)" />
              <div className="entre">
                <span className="mini">Em andamento</span>
                <strong>{numero(ind.andamento)}</strong>
              </div>
              <Barra valor={ind.andamento} max={ind.obras || 1} cor="var(--brandao)" />
              <div className="entre" style={{ borderTop: '1px solid var(--borda)', paddingTop: 10 }}>
                <span className="mini">Investimento total</span>
                <strong>{moedaCompacta(ind.investimento)}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
