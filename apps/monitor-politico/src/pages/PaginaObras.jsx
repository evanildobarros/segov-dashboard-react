import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { HardHat, CheckCircle2, Wallet, Activity } from 'lucide-react';
import { Filtros } from '../components/Filtros';
import { Card, KPI, Barra, Vazio } from '../components/UI';
import { useMunicipiosFiltrados, useStore } from '../lib/store';
import {
  ROTULO_STATUS, COR_STATUS, EIXOS, moeda, moedaCompacta, numero, pct,
} from '../lib/dados';

const STATUS = ['concluida', 'andamento', 'parada', 'planejada'];

export function PaginaObras() {
  const lista = useMunicipiosFiltrados();
  const selecionar = useStore((s) => s.setMunicipioSelecionado);
  const [filtroStatus, setFiltroStatus] = useState('todos');

  const obras = useMemo(
    () => lista.flatMap((m) => m.obras.map((o) => ({ ...o, municipioNome: m.nome, ibge: m.ibge }))),
    [lista],
  );

  const obrasFiltradas = useMemo(
    () => (filtroStatus === 'todos' ? obras : obras.filter((o) => o.status === filtroStatus)),
    [obras, filtroStatus],
  );

  const resumo = useMemo(() => {
    const porStatus = Object.fromEntries(STATUS.map((s) => [s, 0]));
    let investimento = 0;
    for (const o of obras) {
      porStatus[o.status] += 1;
      investimento += o.orcamento;
    }
    return { porStatus, investimento, total: obras.length };
  }, [obras]);

  const porEixo = useMemo(() => {
    const mapa = new Map();
    for (const o of obras) {
      const chave = o.eixo || 0;
      if (!mapa.has(chave)) mapa.set(chave, { eixo: `Eixo ${chave}`, obras: 0, investimento: 0 });
      const r = mapa.get(chave);
      r.obras += 1;
      r.investimento += o.orcamento;
    }
    return [...mapa.values()].sort((a, b) => b.investimento - a.investimento);
  }, [obras]);

  const topMunicipios = useMemo(
    () => lista.filter((m) => m.investimento > 0).sort((a, b) => b.investimento - a.investimento).slice(0, 10),
    [lista],
  );

  const maiorInvestimento = topMunicipios[0]?.investimento || 1;

  return (
    <div className="pagina">
      <Filtros />

      <div className="kpis">
        <KPI rotulo="Obras na carteira" valor={numero(resumo.total)} nota="Com detalhamento por eixo" cor="var(--primaria)" icone={HardHat} />
        <KPI
          rotulo="Concluídas"
          valor={numero(resumo.porStatus.concluida)}
          nota={pct(resumo.total ? (resumo.porStatus.concluida / resumo.total) * 100 : 0)}
          cor="var(--ok)"
          icone={CheckCircle2}
        />
        <KPI rotulo="Em andamento" valor={numero(resumo.porStatus.andamento)} nota={`${numero(resumo.porStatus.parada)} paradas/pendentes`} cor="var(--brandao)" icone={Activity} />
        <KPI rotulo="Investimento" valor={moedaCompacta(resumo.investimento)} nota="Soma dos orçamentos" cor="var(--acento)" icone={Wallet} />
      </div>

      <div className="grid-2">
        <Card titulo="Investimento por eixo" descricao="Distribuição orçamentária da carteira">
          <div style={{ height: 260 }}>
            {porEixo.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porEixo} margin={{ top: 6, right: 10, left: 6, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--borda)" vertical={false} />
                  <XAxis dataKey="eixo" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={moedaCompacta} tickLine={false} axisLine={false} width={70} />
                  <Tooltip formatter={(v) => moeda(v)} cursor={{ fill: 'var(--superficie-2)' }} />
                  <Bar dataKey="investimento" name="Investimento" fill="var(--primaria)" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Vazio>Sem obras no recorte atual.</Vazio>}
          </div>
        </Card>

        <Card titulo="Top municípios por investimento" descricao="Maiores carteiras no recorte">
          <div className="pilha rolagem">
            {topMunicipios.length ? topMunicipios.map((m) => (
              <button key={m.ibge} onClick={() => selecionar(m.ibge)} style={{ all: 'unset', cursor: 'pointer' }}>
                <div className="col" style={{ gap: 5, padding: '6px 0' }}>
                  <div className="entre">
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.nome}</span>
                    <strong style={{ fontSize: 12.5 }}>{moedaCompacta(m.investimento)}</strong>
                  </div>
                  <Barra valor={m.investimento} max={maiorInvestimento} cor="var(--acento)" />
                </div>
              </button>
            )) : <Vazio>Sem investimento registrado.</Vazio>}
          </div>
        </Card>
      </div>

      <Card
        titulo={`${numero(obrasFiltradas.length)} obras`}
        descricao="Detalhamento individual da carteira"
        acao={
          <div className="linha" style={{ flexWrap: 'wrap' }}>
            <button className={`chip ${filtroStatus === 'todos' ? 'chip--ativo' : ''}`} onClick={() => setFiltroStatus('todos')}>
              Todas
            </button>
            {STATUS.map((s) => (
              <button
                key={s}
                className={`chip ${filtroStatus === s ? 'chip--ativo' : ''}`}
                onClick={() => setFiltroStatus(s)}
              >
                <span className="ponto" style={{ background: COR_STATUS[s] }} />
                {ROTULO_STATUS[s]} ({resumo.porStatus[s]})
              </button>
            ))}
          </div>
        }
        corpoClass="tabela-wrap"
      >
        {!obrasFiltradas.length ? (
          <Vazio>Nenhuma obra encontrada para este recorte.</Vazio>
        ) : (
          <div className="rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Município</th>
                  <th style={{ whiteSpace: 'normal', minWidth: 320 }}>Objeto</th>
                  <th>Situação</th>
                  <th>Órgão</th>
                  <th className="num">Orçamento</th>
                  <th style={{ minWidth: 120 }}>Execução</th>
                </tr>
              </thead>
              <tbody>
                {obrasFiltradas.map((o) => (
                  <tr key={o.id} onClick={() => selecionar(o.ibge)}>
                    <td className="td-forte">{o.municipioNome}</td>
                    <td style={{ whiteSpace: 'normal', maxWidth: 420 }}>{o.descricao}</td>
                    <td>
                      <span className="badge" style={{ background: `${COR_STATUS[o.status]}1a`, color: COR_STATUS[o.status] }}>
                        {o.statusOriginal}
                      </span>
                    </td>
                    <td>{o.orgao}</td>
                    <td className="num">{o.orcamento > 0 ? moeda(o.orcamento) : '—'}</td>
                    <td>
                      <span className="linha" style={{ gap: 8 }}>
                        <Barra valor={o.progresso} cor={COR_STATUS[o.status]} />
                        <span className="mini" style={{ width: 30 }}>{o.progresso.toFixed(0)}%</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card titulo="Eixos estratégicos" descricao="Referência da classificação usada na carteira">
        <div className="grid-3">
          {Object.entries(EIXOS).map(([n, rotulo]) => {
            const dados = porEixo.find((e) => e.eixo === `Eixo ${n}`);
            return (
              <div key={n} className="col" style={{ gap: 6, padding: 12, border: '1px solid var(--borda)', borderRadius: 'var(--raio-s)' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{rotulo}</span>
                <span className="mini">
                  {dados ? `${numero(dados.obras)} obras · ${moedaCompacta(dados.investimento)}` : 'Sem obras no recorte'}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
