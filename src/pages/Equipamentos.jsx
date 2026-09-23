import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { LABELS } from '../data/municipios';

export function EquipamentosPage() {
  const { getMunicipiosFiltrados } = useStore();
  const [view, setView] = useState('prioritarios');
  const [filtroEquipamento, setFiltroEquipamento] = useState('todos');


  const municipiosFiltrados = getMunicipiosFiltrados();

  const listaExibicao = view === 'prioritarios'
    ? municipiosFiltrados.filter(m => m.prioritario)
    : municipiosFiltrados;

  // Filtrar por tipo de equipamento
  const listaEquip = filtroEquipamento === 'todos'
    ? listaExibicao
    : listaExibicao.filter(m => {
        const eq = (m.equipamento_solicitado || '').toLowerCase();
        if (filtroEquipamento === 'trator') return eq.includes('trator');
        if (filtroEquipamento === 'retro') return eq.includes('retroescavadeira');
        if (filtroEquipamento === 'viatura') return eq.includes('viatura') || eq.includes('carro') || eq.includes('veículo');
        if (filtroEquipamento === 'caminhao') return eq.includes('caminhão') || eq.includes('caminhao');
        if (filtroEquipamento === 'moto') return eq.includes('moto');
        return true;
      });

  const totalEquip = listaEquip.reduce((s, m) => s + (m.equipamento_solicitado && !/^(nenhum|nenhuma|não solicitado)$/i.test(m.equipamento_solicitado.trim()) ? 1 : 0), 0);
  const totalTractores = listaEquip.filter(m =>
    (m.equipamento_solicitado || '').toLowerCase().includes('trator')
  ).length;
  const totalRetro = listaEquip.filter(m =>
    (m.equipamento_solicitado || '').toLowerCase().includes('retroescavadeira')
  ).length;
  const totalViaturas = listaEquip.filter(m => {
    const eq = (m.equipamento_solicitado || '').toLowerCase();
    return eq.includes('viatura') || eq.includes('carro') || eq.includes('veículo');
  }).length;
  const totalCaminhoes = listaEquip.filter(m =>
    (m.equipamento_solicitado || '').toLowerCase().includes('caminhão') ||
    (m.equipamento_solicitado || '').toLowerCase().includes('caminhao')
  ).length;
  const totalMotos = listaEquip.filter(m =>
    (m.equipamento_solicitado || '').toLowerCase().includes('moto')
  ).length;

  const equipamentosPorGrupo = {};
  listaEquip.forEach(m => {
    const grupo = m.grupo || 'indefinido';
    if (!equipamentosPorGrupo[grupo]) equipamentosPorGrupo[grupo] = {
      total: 0, tratores: 0, retro: 0, viaturas: 0, caminhoes: 0, motos: 0
    };
    const eq = (m.equipamento_solicitado || '').toLowerCase();
    equipamentosPorGrupo[grupo].total++;
    if (eq.includes('trator')) equipamentosPorGrupo[grupo].tratores++;
    if (eq.includes('retroescavadeira')) equipamentosPorGrupo[grupo].retro++;
    if (eq.includes('viatura') || eq.includes('carro') || eq.includes('veículo')) equipamentosPorGrupo[grupo].viaturas++;
    if (eq.includes('caminhão') || eq.includes('caminhao')) equipamentosPorGrupo[grupo].caminhoes++;
    if (eq.includes('moto')) equipamentosPorGrupo[grupo].motos++;
  });

  const totalPrioritarios = listaEquip.filter(m => m.prioritario).length;
  const totalTodos = listaEquip.length;

  // Helper para extrair lista de tipos de um equipamento_solicitado
  const getTipos = (eq) => {
    if (!eq) return [];
    return eq.split(';').map(s => s.trim()).filter(Boolean);
  };

  // Helper para ícone e cor por tipo
  const getTipoInfo = (tipo) => {
    const t = tipo.toLowerCase();
    if (t.includes('trator')) return { icon: '🚜', label: 'Trator Agrícola', color: '#2980B9', bg: '#dbeafe', textColor: '#1e40af' };
    if (t.includes('retroescavadeira')) return { icon: '🚜', label: 'Retroescavadeira', color: '#E67E22', bg: '#fef3c7', textColor: '#92400e' };
    if (t.includes('viatura')) return { icon: '🚓', label: 'Viatura', color: '#1e3a8a', bg: '#dbeafe', textColor: '#1e3a8a' };
    if (t.includes('carro')) return { icon: '🚗', label: 'Carro', color: '#7c3aed', bg: '#ede9fe', textColor: '#5b21b6' };
    if (t.includes('caminhão') || t.includes('caminhao')) return { icon: '🚚', label: 'Caminhão', color: '#0f766e', bg: '#ccfbf1', textColor: '#0f766e' };
    if (t.includes('moto')) return { icon: '🏍️', label: 'Moto', color: '#dc2626', bg: '#fee2e2', textColor: '#991b1b' };
    if (t.includes('ônibus') || t.includes('onibus')) return { icon: '🚌', label: 'Ônibus', color: '#0891b2', bg: '#cffafe', textColor: '#155e75' };
    if (t.includes('ambulância') || t.includes('ambulancia')) return { icon: '🚑', label: 'Ambulância', color: '#dc2626', bg: '#fee2e2', textColor: '#991b1b' };
    return { icon: '🚘', label: tipo, color: 'var(--texto-secundario)', bg: '#f1f5f9', textColor: '#475569' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px'
      }}>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px',
          padding: '16px 18px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#0b3c5d', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', fontWeight: 600, textTransform: 'uppercase' }}>Municípios com solicitação</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--heading)', marginTop: '4px' }}>{totalEquip}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', marginTop: '2px' }}>municípios com solicitação</div>
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px',
          padding: '16px 18px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#2980B9', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', fontWeight: 600, textTransform: 'uppercase' }}>🚜 Tratores Agrícolas</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2980B9', marginTop: '4px' }}>{totalTractores}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', marginTop: '2px' }}>veículos solicitados</div>
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px',
          padding: '16px 18px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#E67E22', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', fontWeight: 600, textTransform: 'uppercase' }}>🚜 Retroescavadeiras</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#E67E22', marginTop: '4px' }}>{totalRetro}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', marginTop: '2px' }}>veículos solicitados</div>
        </div>
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px',
          padding: '16px 18px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#1e3a8a', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', fontWeight: 600, textTransform: 'uppercase' }}>🚓 Viaturas / Carros</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>{totalViaturas}</div>
          <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', marginTop: '2px' }}>veículos solicitados</div>
        </div>
        {totalCaminhoes > 0 && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px',
            padding: '16px 18px', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#0f766e', borderRadius: '3px' }}></div>
            <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', fontWeight: 600, textTransform: 'uppercase' }}>🚚 Caminhões</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f766e', marginTop: '4px' }}>{totalCaminhoes}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', marginTop: '2px' }}>veículos solicitados</div>
          </div>
        )}
        {totalMotos > 0 && (
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px',
            padding: '16px 18px', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#dc2626', borderRadius: '3px' }}></div>
            <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', fontWeight: 600, textTransform: 'uppercase' }}>🏍️ Motos</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{totalMotos}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--texto-secundario)', marginTop: '2px' }}>veículos solicitados</div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px',
        padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 600 }}>Filtro:</span>
        <button
          onClick={() => setFiltroEquipamento('todos')}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--borda)',
            background: filtroEquipamento === 'todos' ? '#0b3c5d' : 'var(--bg-card)',
            color: filtroEquipamento === 'todos' ? '#fff' : 'var(--texto)',
            fontSize: '12px', cursor: 'pointer', fontWeight: 600
          }}
        >Todos</button>
        <button
          onClick={() => setFiltroEquipamento('trator')}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--borda)',
            background: filtroEquipamento === 'trator' ? '#2980B9' : 'var(--bg-card)',
            color: filtroEquipamento === 'trator' ? '#fff' : 'var(--texto)',
            fontSize: '12px', cursor: 'pointer', fontWeight: 600
          }}
        >🚜 Tratores</button>
        <button
          onClick={() => setFiltroEquipamento('retro')}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--borda)',
            background: filtroEquipamento === 'retro' ? '#E67E22' : 'var(--bg-card)',
            color: filtroEquipamento === 'retro' ? '#fff' : 'var(--texto)',
            fontSize: '12px', cursor: 'pointer', fontWeight: 600
          }}
        >🚜 Retroescavadeiras</button>
        <button
          onClick={() => setFiltroEquipamento('viatura')}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--borda)',
            background: filtroEquipamento === 'viatura' ? '#1e3a8a' : 'var(--bg-card)',
            color: filtroEquipamento === 'viatura' ? '#fff' : 'var(--texto)',
            fontSize: '12px', cursor: 'pointer', fontWeight: 600
          }}
        >🚓 Viaturas / Carros</button>
        {totalCaminhoes > 0 && (
          <button
            onClick={() => setFiltroEquipamento('caminhao')}
            style={{
              padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--borda)',
              background: filtroEquipamento === 'caminhao' ? '#0f766e' : 'var(--bg-card)',
              color: filtroEquipamento === 'caminhao' ? '#fff' : 'var(--texto)',
              fontSize: '12px', cursor: 'pointer', fontWeight: 600
            }}
          >🚚 Caminhões</button>
        )}
        {totalMotos > 0 && (
          <button
            onClick={() => setFiltroEquipamento('moto')}
            style={{
              padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--borda)',
              background: filtroEquipamento === 'moto' ? '#dc2626' : 'var(--bg-card)',
              color: filtroEquipamento === 'moto' ? '#fff' : 'var(--texto)',
              fontSize: '12px', cursor: 'pointer', fontWeight: 600
            }}
          >🏍️ Motos</button>
        )}

        <div style={{ flex: 1 }} />

        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--borda)',
            background: 'var(--bg-card)', color: 'var(--texto)',
            fontSize: '12px', cursor: 'pointer', fontWeight: 600
          }}
        >
          <option value="prioritarios">Prioritários ({totalPrioritarios})</option>
          <option value="todos">Todos ({totalTodos})</option>
        </select>
      </div>

      {/* Resumo por grupo */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px',
        padding: '16px 18px'
      }}>
        <h3 style={{ fontSize: '14px', color: 'var(--heading)', marginBottom: '12px' }}>📊 Resumo por Grupo Político — Veículos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {Object.entries(equipamentosPorGrupo).map(([grupo, stats]) => (
            <div key={grupo} style={{
              background: 'var(--surface-muted)', border: '1px solid var(--borda)', borderRadius: '8px',
              padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--heading)' }}>{LABELS[grupo] || grupo}</div>
                <div style={{ fontSize: '11px', color: 'var(--texto-secundario)' }}>{stats.total} municípios</div>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', flexWrap: 'wrap' }}>
                <span style={{ color: '#2980B9', fontWeight: 600 }}>🚜 {stats.tratores}</span>
                <span style={{ color: '#E67E22', fontWeight: 600 }}>🚜 {stats.retro}</span>
                <span style={{ color: '#1e3a8a', fontWeight: 600 }}>🚓 {stats.viaturas}</span>
                {stats.caminhoes > 0 && <span style={{ color: '#0f766e', fontWeight: 600 }}>🚚 {stats.caminhoes}</span>}
                {stats.motos > 0 && <span style={{ color: '#dc2626', fontWeight: 600 }}>🏍️ {stats.motos}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de equipamentos */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--borda)', borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'var(--surface-muted)', padding: '8px 12px', borderBottom: '1px solid var(--borda)',
          fontSize: '12px', fontWeight: 600, color: 'var(--heading)'
        }}>
          🚘 Relação de Municípios e Veículos Solicitados ({listaEquip.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '700px' }}>
            <thead style={{ background: 'var(--surface-muted)', position: 'sticky', top: 0 }}>
              <tr>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid var(--borda)', color: 'var(--texto-secundario)' }}>Município</th>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid var(--borda)', color: 'var(--texto-secundario)' }}>Grupo</th>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid var(--borda)', color: 'var(--texto-secundario)' }}>Veículo Solicitado</th>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid var(--borda)', color: 'var(--texto-secundario)' }}>Categorias</th>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid var(--borda)', color: 'var(--texto-secundario)' }}>Prefeito</th>
              </tr>
            </thead>
            <tbody>
              {listaEquip.map((mun, idx) => {
                const corGrupo = mun.cor || '#555';
                const tipos = getTipos(mun.equipamento_solicitado);
                return (
                  <tr key={`${mun.ibge}-${idx}`} style={{ borderBottom: '1px solid var(--borda)' }}>
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: corGrupo }}></span>
                        <strong style={{ color: 'var(--texto)' }}>{mun.nome}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px', fontSize: '10px', color: 'var(--texto-secundario)' }}>
                      {LABELS[mun.grupo] || mun.grupo}
                    </td>
                    <td style={{ padding: '6px 10px', color: 'var(--texto)' }}>{mun.equipamento_solicitado || '—'}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {tipos.length === 0 ? (
                          <span style={{ color: 'var(--texto-secundario)' }}>—</span>
                        ) : (
                          tipos.map((tipo, i) => {
                            const info = getTipoInfo(tipo);
                            return (
                              <span key={i} style={{
                                fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                                background: info.bg, color: info.textColor, fontWeight: 600
                              }}>
                                {info.icon} {info.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px', color: 'var(--texto)' }}>{mun.prefeito || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
