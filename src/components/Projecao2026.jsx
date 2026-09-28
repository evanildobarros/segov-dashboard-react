import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import projection from '../data/projecao_eleicoes_2026.json';
import sources from '../data/projecao_fontes.json';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  const latestBraide = [...sources.polls].reverse().find(p => p.braide != null && p.chart !== false);
  const latestOrleans = [...sources.polls].reverse().find(p => p.orleans != null);
  const approval = sources.approval.at(-1);
  const serie = sources.polls.filter(p => p.chart !== false && p.braide != null && p.orleans != null);
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
    <header><h1>Projeção Eleitoral 2026</h1><p>Cenários estruturados e pesquisas de referência para o Maranhão; sem probabilidade eleitoral calibrada.</p></header>
    <section className="projection-grid" aria-label="Indicadores de referência">
      <article className="projection-card"><h2>Braide · registro mais recente divulgado</h2><strong className="projection-value">{percent(latestBraide?.braide)}</strong><p>{latestBraide?.date} · {latestBraide?.institute}</p><small>{latestBraide?.sample ? `n=${latestBraide.sample}` : 'Amostra não informada'} · margem {latestBraide?.margin || 'não informada'}. Não comparar diretamente com levantamentos de outra data/instituto.</small></article>
      <article className="projection-card"><h2>Orleans · registro mais recente divulgado</h2><strong className="projection-value">{percent(latestOrleans?.orleans)}</strong><p>{latestOrleans?.date} · {latestOrleans?.institute}</p><small>Resultado reportado pela pesquisa; diferenças entre institutos e períodos de campo não são uma série diretamente comparável.</small></article>
      <article className="projection-card"><h2>Aprovação do governo Brandão</h2><strong className="projection-value">{percent(approval.value)}</strong><p>{approval.date} · {approval.institute}</p><small>Pesquisa e método diferentes da referência anterior ({percent(sources.approval[0].value)} em {sources.approval[0].date}); não interpretar a diferença como evolução homogênea. Indicador de contexto, não intenção de voto.</small></article>
    </section>
    {analysis && <section className="projection-card"><h2>Análise estruturada JEV</h2><p>Atualizada em {analysis.data_atualizacao} · Modelo {analysis.model}</p>
      <div className="projection-grid">
        <article><h3>Cenário de primeiro turno</h3><p>{outcomes[analysis.desfecho_1t.escolha] ?? analysis.desfecho_1t.escolha}</p><small>Distribuição interna do JEV: {percent(analysis.desfecho_1t.probs[analysis.desfecho_1t.escolha] * 100)} · confiança interna: {percent(Number(analysis.desfecho_1t.confianca || 0) * 100)}. Não é probabilidade eleitoral calibrada.</small></article>
        <article><h3>Cenário de segundo turno</h3><p>{outcomes[analysis.desfecho_2t.escolha] ?? analysis.desfecho_2t.escolha}</p><small>Distribuição interna do JEV: {percent(analysis.desfecho_2t.probs[analysis.desfecho_2t.escolha] * 100)} · confiança interna: {percent(Number(analysis.desfecho_2t.confianca || 0) * 100)}. Não é probabilidade eleitoral calibrada.</small></article>
      </div><p className="projection-note">{analysis.revision} {analysis.metodologia} Pesquisas de institutos e períodos distintos não formam uma série homogênea.</p>
    </section>}
    {projection.state_metrics.historical_validation && <section className="projection-card"><h2>Validação histórica exploratória · TSE</h2>
      <p>Base de 2018 e 2022: {projection.state_metrics.historical_validation.cobertura_municipios['2018']}/217 e {projection.state_metrics.historical_validation.cobertura_municipios['2022']}/217 municípios. O total de votos válidos de 2022 ({projection.state_metrics.historical_validation.votos_validos_2022.toLocaleString('pt-BR')}) confere com a totalização estadual do TSE.</p>
      <p>Diagnóstico espacial 2018→2022: erro ponderado OLS LOO de {projection.state_metrics.historical_validation.diagnostico_espacial.wmae_ols_loo_pp.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} p.p., contra {projection.state_metrics.historical_validation.diagnostico_espacial.wmae_baseline_media_estadual_pp.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} p.p. do baseline da média estadual; a regressão não superou o baseline.</p>
      <p className="projection-note">{projection.state_metrics.historical_validation.limitacoes}</p>
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
      </div>
    </section>
    <section className="projection-card"><h2>Pesquisas de referência</h2><p>Institutos, cenários e bases diferentes. A linha Veritá de março utiliza votos válidos. O gráfico usa registros pareados; institutos e datas diferentes não formam uma série comparável. O IP Sensus MA-02374 de20/set tem resultados para Braide e Orleans; a linha unilateral de14/set, reportada separadamente no DOCX, segue sem metadados confirmados. O MA-02569 foi reconciliado.</p>
      <div className="projection-table-wrap" tabIndex={0} role="region" aria-label="Tabela de pesquisas"><table><thead><tr>{['Data', 'Instituto', 'Amostra', 'Margem', 'Braide', 'Orleans', 'Nota'].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{sources.polls.map(poll => <tr key={`${poll.date}-${poll.institute}`}><td>{poll.date}</td><td>{poll.institute}</td><td>{poll.sample ?? 'Não informada'}</td><td>{poll.margin ?? 'Não informada'}</td><td>{percent(poll.braide)}</td><td>{percent(poll.orleans)}</td><td>{poll.note || '—'}</td></tr>)}</tbody></table></div>
      <small>Fontes: planilha enviada, cobertura pública das pesquisas e documento de contexto. IPPI MA-09665, Quaest MA-07074, IP Sensus MA-02374 e Real Time MA-02569 foram conferidos em fontes independentes; as demais linhas mantêm as ressalvas próprias. Alegações judiciais do documento não foram tratadas como decisões confirmadas.</small>
    </section>
    <section className="projection-card"><h2>Apoio municipal · {projection.municipalities.length} municípios</h2><div className="projection-legend">{Object.entries(counts).map(([name, count]) => <span key={name}><i style={{ background: colors[name] }} />{name}: <strong>{count}</strong></span>)}</div><p>Classificação oficial SEGOV: Orleans156 · Braide38 · indefinidos23. O JEV manteve os23 sem evidência direta como indefinidos. A contagem de municípios é proxy de alinhamento político, não proporção de votos; a ponderação pelo eleitorado municipal está suspensa até reconciliação das fontes.</p>
      {error ? <p role="alert">Não foi possível carregar o mapa. <button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></p> : !geometry ? <p role="status">Carregando limites municipais…</p> : <div className="projection-map"><MapContainer bounds={[[-10.3, -48.8], [-1, -41.7]]} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}" attribution='Tiles &copy; Esri — Sources: Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, &copy; OpenStreetMap contributors, and the GIS User Community' /><GeoJSON data={geometry} style={styleFeature} onEachFeature={bindFeature} /></MapContainer></div>}
    </section>
  </div>;
}
