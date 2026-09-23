import { useStore } from '../hooks/useStore';
export function DataStatus({ children }) {
  const { municipios, municipiosCarregados, carregandoMunicipios, erroMunicipios, ultimaAtualizacao, fetchMunicipios } = useStore();
  if (!municipiosCarregados && !erroMunicipios) return <div className="data-state" role="status"><span className="loading-dot" />Carregando municípios…</div>;
  if (erroMunicipios && !municipios.length) return <section className="data-state" role="alert"><h2>Não foi possível carregar os dados</h2><p>Verifique sua conexão e tente novamente.</p><button className="primary-button" disabled={carregandoMunicipios} onClick={fetchMunicipios}>{carregandoMunicipios ? 'Tentando novamente…' : 'Tentar novamente'}</button></section>;
  if (!municipios.length) return <section className="data-state"><h2>Nenhum município disponível</h2><p>A fonte de dados retornou uma lista vazia.</p><button className="primary-button" disabled={carregandoMunicipios} onClick={fetchMunicipios}>Atualizar dados</button></section>;
  const data = ultimaAtualizacao ? new Date(ultimaAtualizacao) : null;
  return <>
    {erroMunicipios && <div className="data-warning" role="alert">Não foi possível atualizar. Exibindo os últimos dados carregados. <button disabled={carregandoMunicipios} onClick={fetchMunicipios}>Tentar novamente</button></div>}
    <p className="data-timestamp">{data && !Number.isNaN(data.getTime()) ? `Atualização informada pela fonte: ${data.toLocaleString('pt-BR')}` : 'Data de atualização não informada pela fonte'}</p>
    {children}
  </>;
}
