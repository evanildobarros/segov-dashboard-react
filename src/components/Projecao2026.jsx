import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import projection from '../data/projecao_eleicoes_2026.json';
import sources from '../data/projecao_fontes.json';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Projecao2026.css';

const colors = { Orleans: '#3b82f6', Braide: '#f97316', Indefinido: '#94a3b8' };
const supportOf = (m) => m?.['Apoio a Orleans'] === 'Sim' ? 'Orleans' : m?.['Apoio a Braide'] === 'Sim' ? 'Braide' : 'Indefinido';
const byCode = new Map(projection.municipalities.map(m => [String(m['Código IBGE']), m]));
const counts = projection.municipalities.reduce((acc, m) => { acc[supportOf(m)]++; return acc; }, { Orleans: 0, Braide: 0, Indefinido: 0 });
const percent = value => value == null ? 'Não informado' : `${value.toLocaleString('pt-BR')}%`;
const outcomes = { segundo_turno_braide_lidera: 'Segundo turno com Braide na liderança', segundo_turno_orleans_lidera: 'Segundo turno com Orleans na liderança', vitoria_1t_braide: 'Vitória de Braide no primeiro turno', disputa_muito_apertada: 'Disputa muito apertada', braide_x_orleans: 'Braide × Orleans', braide_x_camarao: 'Braide × Camarão', outro_confronto: 'Outro confronto' };
const styleFeature = feature => ({ color: '#ffffff', weight: 1, fillColor: colors[supportOf(byCode.get(String(feature.properties.CD_MUN)))], fillOpacity: 0.7 });
function bindFeature(feature, layer) {
  const m = byCode.get(String(feature.properties.CD_MUN));
  const content = document.createElement('div');
  content.textContent = `${feature.properties.NM_MUN} — Apoio cadastrado: ${supportOf(m)}`;
  layer.bindTooltip(content, { sticky: true });
}

export default function Projecao2026() {
  const [geometry, setGeometry] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const analysis = projection.state_metrics.jev_analysis;
  const latest = sources.polls.at(-1);
  const approval = sources.approval.at(-1);
  const faixas = ['Muito baixa', 'Baixa', 'Moderada', 'Alta', 'Muito alta'];
  const probsFaixas = analysis ? faixas.map((f, i) => ({
    faixa: f,
    Braide: Math.round(Number((analysis.prob_vitoria_braide.probs || {})[i] || 0) * 100),
    Orleans: Math.round(Number((analysis.prob_vitoria_orleans.probs || {})[i] || 0) * 100),
  })) : [];
  const serie = sources.polls.filter(p => p.braide != null);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch('/ma_municipios.min.geojson', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Mapa indisponível'); return response.json(); })
      .then(data => { if (!Array.isArray(data.features)) throw new Error('Mapa inválido'); setGeometry(data); })
      .catch(err => { if (err.name !== 'AbortError') setError(true); });
    return () => controller.abort();
  }, [attempt]);
  return <div className="projection-container">
    <header><h1>Projeção Eleitoral 2026</h1><p>Análise preditiva e pesquisas de referência para o Maranhão.</p></header>
    <section className="projection-grid" aria-label="Indicadores de referência">
      <article className="projection-card"><h2>Braide · intenção de voto</h2><strong className="projection-value">{percent(latest.braide)}</strong><p>Pesquisa estimulada · {latest.date}</p><small>{latest.institute} · {latest.sample} entrevistas · margem {latest.margin}</small></article>
      <article className="projection-card"><h2>Aprovação do governo Brandão</h2><strong className="projection-value">{percent(approval.value)}</strong><p>{approval.date} · {approval.institute}</p><small>Referência anterior: {percent(sources.approval[0].value)} em {sources.approval[0].date}.</small></article>
    </section>
    {analysis && <section className="projection-card"><h2>Análise preditiva JEV</h2><p>Gerada em {new Date(analysis.gerado_em).toLocaleString('pt-BR')} · Modelo {analysis.model}</p>
      <div className="projection-grid">
        <article><h3>Cenário de primeiro turno</h3><p>{outcomes[analysis.desfecho_1t.escolha] ?? analysis.desfecho_1t.escolha}</p><small>Probabilidade atribuída pelo modelo: {percent(analysis.desfecho_1t.probs[analysis.desfecho_1t.escolha] * 100)}</small></article>
        <article><h3>Confronto de segundo turno</h3><p>{outcomes[analysis.desfecho_2t.escolha] ?? analysis.desfecho_2t.escolha}</p><small>Probabilidade atribuída pelo modelo: {percent(analysis.desfecho_2t.probs[analysis.desfecho_2t.escolha] * 100)}</small></article>
        <article><h3>Chance de vitória · Braide</h3><p>{analysis.prob_vitoria_braide.faixa}</p></article>
        <article><h3>Chance de vitória · Orleans</h3><p>{analysis.prob_vitoria_orleans.faixa}</p></article>
      </div><p className="projection-note">Estimativas do modelo registrado, distintas dos percentuais de intenção de voto. A página apresenta a análise salva; não executa uma nova previsão.</p>
    </section>}
    <section className="projection-card"><h2>Gráficos de projeção</h2>
      <div className="projection-grid">
        <article><h3>Evolução das pesquisas — Braide × Orleans</h3>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={serie}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis domain={[0, 60]} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Line type="monotone" dataKey="braide" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} name="Eduardo Braide" />
                <Line type="monotone" dataKey="orleans" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Orleans Brandão" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <small>Séries de metodologias diferentes — linha indicativa, não série comparável (ver tabela abaixo).</small>
        </article>
        {analysis && <article><h3>Probabilidade de vitória — JEV</h3>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={probsFaixas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="faixa" fontSize={11} />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Bar dataKey="Braide" fill="#f97316" name="Braide (PSD)" />
                <Bar dataKey="Orleans" fill="#3b82f6" name="Orleans (MDB)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <small>Distribuição de probabilidade do modelo {analysis.model} — faixas: muito baixa (&lt;20%) a muito alta (&gt;80%).</small>
        </article>}
      </div>
    </section>
    <section className="projection-card"><h2>Pesquisas de referência</h2><p>Institutos, cenários e bases diferentes. A linha Veritá de março utiliza votos válidos; os resultados não compõem uma série diretamente comparável.</p>
      <div className="projection-table-wrap" tabIndex={0} role="region" aria-label="Tabela de pesquisas"><table><thead><tr>{['Data', 'Instituto', 'Amostra', 'Margem', 'Braide', 'Orleans'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{sources.polls.map(poll => <tr key={`${poll.date}-${poll.institute}`}><td>{poll.date}</td><td>{poll.institute}</td><td>{poll.sample ?? 'Não informada'}</td><td>{poll.margin ?? 'Não informada'}</td><td>{percent(poll.braide)}</td><td>{percent(poll.orleans)}</td></tr>)}</tbody></table></div>
      <small>Fonte: {sources.source}, aba “1o turno - estimulada”. n.i.: instituto não identificado; n.d.: não divulgado. Agosto/Veritá: somente os dois primeiros colocados informados.</small>
    </section>
    <section className="projection-card"><h2>Apoio municipal · {projection.municipalities.length} municípios</h2><div className="projection-legend">{Object.entries(counts).map(([name, count]) => <span key={name}><i style={{ background: colors[name] }} />{name}: <strong>{count}</strong></span>)}</div><p>Classificação da base SEGOV utilizada na análise. Contagem de municípios, sem ponderação pelo eleitorado; evidências individuais de apoio não estão preenchidas.</p>
      {error ? <p role="alert">Não foi possível carregar o mapa. <button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></p> : !geometry ? <p role="status">Carregando limites municipais…</p> : <div className="projection-map"><MapContainer bounds={[[-10.3, -48.8], [-1, -41.7]]} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><GeoJSON data={geometry} style={styleFeature} onEachFeature={bindFeature} /></MapContainer></div>}
    </section>
  </div>;
}
