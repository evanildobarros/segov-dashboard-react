import { Star, Download } from 'lucide-react';
import { Filtros } from '../components/Filtros';
import { Card, BadgeGrupo, Barra, Vazio, corRisco } from '../components/UI';
import { useMunicipiosFiltrados, useStore } from '../lib/store';
import { numero, moedaCompacta, pct } from '../lib/dados';

function exportarCSV(lista) {
  const cabecalho = [
    'IBGE', 'Município', 'Grupo', 'Mesorregião', 'Prefeito', 'Partido',
    'Lideranças', 'Obras', 'Entregues', 'Em andamento', 'Investimento', 'Risco',
  ];
  const linhas = lista.map((m) => [
    m.ibge, m.nome, m.grupo, m.mesorregiao, m.prefeito, m.partido,
    m.totalLiderancas, m.totalObras, m.obrasEntregues, m.obrasEmAndamento,
    m.investimento.toFixed(2), m.risco,
  ]);
  const csv = [cabecalho, ...linhas]
    .map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `radar-politico-municipios-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function PaginaMunicipios() {
  const lista = useMunicipiosFiltrados();
  const selecionar = useStore((s) => s.setMunicipioSelecionado);

  return (
    <div className="pagina">
      <Filtros mostrarOrdenacao />

      <Card
        titulo={`${numero(lista.length)} municípios`}
        descricao="Clique em uma linha para abrir o dossiê completo"
        corpoClass="tabela-wrap"
        acao={
          <button className="botao" onClick={() => exportarCSV(lista)} disabled={!lista.length}>
            <Download size={14} /> Exportar CSV
          </button>
        }
      >
        {!lista.length ? (
          <Vazio />
        ) : (
          <table className="tabela">
            <thead>
              <tr>
                <th>Município</th>
                <th>Grupo</th>
                <th>Mesorregião</th>
                <th>Prefeito(a)</th>
                <th className="num">Lideranças</th>
                <th className="num">Obras</th>
                <th className="num">Entregues</th>
                <th className="num">Investimento</th>
                <th style={{ minWidth: 130 }}>Risco</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((m) => (
                <tr key={m.ibge} onClick={() => selecionar(m.ibge)}>
                  <td className="td-forte">
                    <span className="linha" style={{ gap: 6 }}>
                      {m.nome}
                      {m.prioritario && <Star size={12} color="var(--alerta)" fill="var(--alerta)" />}
                    </span>
                  </td>
                  <td><BadgeGrupo grupo={m.grupo} /></td>
                  <td>{m.mesorregiao.replace(' Maranhense', '')}</td>
                  <td>{m.prefeito || '—'}{m.partido ? ` (${m.partido})` : ''}</td>
                  <td className="num">{numero(m.totalLiderancas)}</td>
                  <td className="num">{numero(m.totalObras)}</td>
                  <td className="num">
                    {numero(m.obrasEntregues)}
                    <span className="mini"> · {pct(m.taxaEntrega * 100, 0)}</span>
                  </td>
                  <td className="num">{m.investimento > 0 ? moedaCompacta(m.investimento) : '—'}</td>
                  <td>
                    <span className="linha" style={{ gap: 8 }}>
                      <Barra valor={m.risco} cor={corRisco(m.risco)} />
                      <strong style={{ color: corRisco(m.risco), fontSize: 12.5, width: 22 }}>{m.risco}</strong>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
