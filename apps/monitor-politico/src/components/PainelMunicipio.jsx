import { X, MapPin, Users, HardHat, Wallet, Star, User, Building } from 'lucide-react';
import { useStore } from '../lib/store';
import { MUNICIPIOS_POR_IBGE, moeda, numero, pct, ROTULO_STATUS, COR_STATUS, EIXOS } from '../lib/dados';
import { BadgeGrupo, Barra, corRisco } from './UI';

function Dado({ rotulo, valor }) {
  return (
    <div className="col" style={{ gap: 2 }}>
      <span className="dado__rotulo">{rotulo}</span>
      <span className="dado__valor">{valor || '—'}</span>
    </div>
  );
}

export function PainelMunicipio() {
  const ibge = useStore((s) => s.municipioSelecionado);
  const fechar = () => useStore.getState().setMunicipioSelecionado(null);
  const m = ibge ? MUNICIPIOS_POR_IBGE.get(ibge) : null;
  if (!m) return null;

  return (
    <>
      <div className="overlay" onClick={fechar} />
      <aside className="painel-lateral">
        <header className="painel-lateral__cabecalho">
          <div className="col" style={{ flex: 1, gap: 6 }}>
            <div className="linha" style={{ flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 19, letterSpacing: '-.4px' }}>{m.nome}</h2>
              {m.prioritario && (
                <span className="badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                  <Star size={11} /> Prioritário
                </span>
              )}
            </div>
            <div className="linha" style={{ flexWrap: 'wrap', gap: 8 }}>
              <BadgeGrupo grupo={m.grupo} />
              <span className="mini"><MapPin size={11} /> {m.mesorregiao}</span>
              <span className="mini">IBGE {m.ibge}</span>
            </div>
          </div>
          <button className="icone-btn" onClick={fechar} aria-label="Fechar">
            <X size={17} />
          </button>
        </header>

        <div className="painel-lateral__corpo">
          {/* Índice de risco */}
          <div className="card" style={{ boxShadow: 'none' }}>
            <div className="card__corpo col" style={{ gap: 9 }}>
              <div className="entre">
                <span className="dado__rotulo">Índice de atenção política</span>
                <strong style={{ color: corRisco(m.risco), fontSize: 17 }}>{m.risco}/100</strong>
              </div>
              <Barra valor={m.risco} cor={corRisco(m.risco)} />
              <span className="mini">
                Combina alinhamento, prioridade estratégica, execução de obras e presença de lideranças.
              </span>
            </div>
          </div>

          {/* Gestão */}
          <div className="col" style={{ gap: 10 }}>
            <span className="card__titulo">Gestão municipal</span>
            <div className="lista-dados">
              <Dado rotulo="Prefeito(a)" valor={m.prefeito} />
              <Dado rotulo="Partido" valor={m.partido} />
              <Dado rotulo="Assessor regional" valor={m.assessor} />
              <Dado rotulo="Alinhamento declarado" valor={m.alinhamento} />
              {m.eleitores > 0 && <Dado rotulo="Eleitores" valor={numero(m.eleitores)} />}
              {m.equipamento && <Dado rotulo="Equipamento solicitado" valor={m.equipamento} />}
            </div>
            {m.detalhes && <p className="mini" style={{ margin: 0, lineHeight: 1.6 }}>{m.detalhes}</p>}
          </div>

          {/* Base política */}
          <div className="col" style={{ gap: 10 }}>
            <span className="card__titulo"><Users size={13} /> Base política</span>
            <div className="lista-dados">
              <Dado rotulo="Lideranças mapeadas" valor={numero(m.totalLiderancas)} />
              <Dado rotulo="Apoios Brandão" valor={numero(m.apoiosBrandao)} />
              <Dado rotulo="Apoios Braide" valor={numero(m.apoiosBraide)} />
              <Dado rotulo="Apoios neutros" valor={numero(m.apoiosNeutro)} />
            </div>
          </div>

          {/* Obras */}
          <div className="col" style={{ gap: 10 }}>
            <span className="card__titulo"><HardHat size={13} /> Obras</span>
            <div className="lista-dados">
              <Dado rotulo="Total de obras" valor={numero(m.totalObras)} />
              <Dado rotulo="Em andamento" valor={numero(m.obrasEmAndamento)} />
              <Dado rotulo="Entregues" valor={numero(m.obrasEntregues)} />
              <Dado rotulo="Taxa de entrega" valor={pct(m.taxaEntrega * 100)} />
            </div>

            {m.temCarteira && (
              <>
                <div className="entre" style={{ marginTop: 4 }}>
                  <span className="mini"><Wallet size={12} /> Investimento monitorado</span>
                  <strong style={{ fontSize: 14 }}>{moeda(m.investimento)}</strong>
                </div>
                {m.eixo && <span className="mini">{EIXOS[m.eixo] || `Eixo ${m.eixo}`}</span>}

                <div className="pilha" style={{ marginTop: 6 }}>
                  {m.obras.map((o) => (
                    <div key={o.id} className="obra-item">
                      <span className="obra-item__titulo">{o.descricao}</span>
                      <div className="obra-item__meta">
                        <span className="badge" style={{ background: `${COR_STATUS[o.status]}1a`, color: COR_STATUS[o.status] }}>
                          {ROTULO_STATUS[o.status]}
                        </span>
                        <span><Building size={11} /> {o.orgao}</span>
                        {o.orcamento > 0 && <span>{moeda(o.orcamento)}</span>}
                      </div>
                      {o.progresso > 0 && (
                        <div className="linha">
                          <Barra valor={o.progresso} cor={COR_STATUS[o.status]} />
                          <span className="mini">{o.progresso.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {!m.temCarteira && (
              <span className="mini">Sem carteira detalhada de obras disponível para este município.</span>
            )}
          </div>

          {/* Contatos */}
          {(m.contatos.email || m.contatos.telefone || m.contatos.instagram || m.contatos.site) && (
            <div className="col" style={{ gap: 10 }}>
              <span className="card__titulo"><User size={13} /> Contatos</span>
              <div className="lista-dados">
                <Dado rotulo="E-mail" valor={m.contatos.email} />
                <Dado rotulo="Telefone" valor={m.contatos.telefone} />
                <Dado rotulo="Instagram" valor={m.contatos.instagram} />
                <Dado rotulo="Site" valor={m.contatos.site} />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
