import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { formatCurrency } from '../data/municipios';

export function EquipamentosPage() {
  const { municipios, getMunicipiosFiltrados, setGrupo } = useStore();
  const [view, setView] = useState('prioritarios');
  const [filtroEquipamento, setFiltroEquipamento] = useState('todos');

  useEffect(() => {
    setGrupo('todos');
  }, [setGrupo]);

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
        return true;
      });

  const totalEquip = listaEquip.reduce((s, m) => s + (m.equipamento_solicitado ? 1 : 0), 0);
  const totalTractores = listaEquip.filter(m =>
    (m.equipamento_solicitado || '').toLowerCase().includes('trator')
  ).length;
  const totalRetro = listaEquip.filter(m =>
    (m.equipamento_solicitado || '').toLowerCase().includes('retroescavadeira')
  ).length;

  const equipamentosPorGrupo = {};
  listaEquip.forEach(m => {
    const grupo = m.grupo || 'indefinido';
    if (!equipamentosPorGrupo[grupo]) equipamentosPorGrupo[grupo] = { total: 0, tratores: 0, retro: 0 };
    equipamentosPorGrupo[grupo].total++;
    if ((m.equipamento_solicitado || '').toLowerCase().includes('trator')) equipamentosPorGrupo[grupo].tratores++;
    if ((m.equipamento_solicitado || '').toLowerCase().includes('retroescavadeira')) equipamentosPorGrupo[grupo].retro++;
  });

  const totalPrioritarios = listaEquip.filter(m => m.prioritario).length;
  const totalTodos = listaEquip.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}>
        <div style={{
          background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px',
          padding: '16px 18px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#0b3c5d', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', fontWeight: 600, textTransform: 'uppercase' }}>Total Equipamentos</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0b3c5d', marginTop: '4px' }}>{totalEquip}</div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', marginTop: '2px' }}>municipios com solicitação</div>
        </div>
        <div style={{
          background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px',
          padding: '16px 18px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#2980B9', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', fontWeight: 600, textTransform: 'uppercase' }}>🚜 Tratores Agrícolas</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2980B9', marginTop: '4px' }}>{totalTractores}</div>
        </div>
        <div style={{
          background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px',
          padding: '16px 18px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: '#E67E22', borderRadius: '3px' }}></div>
          <div style={{ fontSize: '11.5px', color: '#7a8a99', fontWeight: 600, textTransform: 'uppercase' }}>🚜 Retroescavadeiras</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#E67E22', marginTop: '4px' }}>{totalRetro}</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px',
        padding: '14px 18px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '12px', color: '#7a8a99', fontWeight: 600 }}>Filtro:</span>
        <button
          onClick={() => setFiltroEquipamento('todos')}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid #dde3ea',
            background: filtroEquipamento === 'todos' ? '#0b3c5d' : '#fff',
            color: filtroEquipamento === 'todos' ? '#fff' : '#22313f',
            fontSize: '12px', cursor: 'pointer', fontWeight: 600
          }}
        >Todos</button>
        <button
          onClick={() => setFiltroEquipamento('trator')}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid #dde3ea',
            background: filtroEquipamento === 'trator' ? '#2980B9' : '#fff',
            color: filtroEquipamento === 'trator' ? '#fff' : '#22313f',
            fontSize: '12px', cursor: 'pointer', fontWeight: 600
          }}
        >🚜 Tratores</button>
        <button
          onClick={() => setFiltroEquipamento('retro')}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid #dde3ea',
            background: filtroEquipamento === 'retro' ? '#E67E22' : '#fff',
            color: filtroEquipamento === 'retro' ? '#fff' : '#22313f',
            fontSize: '12px', cursor: 'pointer', fontWeight: 600
          }}
        >🚜 Retroescavadeiras</button>

        <div style={{ flex: 1 }} />

        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid #dde3ea',
            background: '#fff', color: '#22313f',
            fontSize: '12px', cursor: 'pointer', fontWeight: 600
          }}
        >
          <option value="prioritarios">Prioritários ({totalPrioritarios})</option>
          <option value="todos">Todos ({totalTodos})</option>
        </select>
      </div>

      {/* Resumo por grupo */}
      <div style={{
        background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px',
        padding: '16px 18px'
      }}>
        <h3 style={{ fontSize: '14px', color: '#0b3c5d', marginBottom: '12px' }}>📊 Resumo por Grupo Político</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
          {Object.entries(equipamentosPorGrupo).map(([grupo, stats]) => (
            <div key={grupo} style={{
              background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px',
              padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0b3c5d' }}>{grupo}</div>
                <div style={{ fontSize: '11px', color: '#7a8a99' }}>{stats.total} municípios</div>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
                <span style={{ color: '#2980B9', fontWeight: 600 }}>🚜 {stats.tratores}</span>
                <span style={{ color: '#E67E22', fontWeight: 600 }}>🚜 {stats.retro}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de equipamentos */}
      <div style={{
        background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#f8fafc', padding: '8px 12px', borderBottom: '1px solid #e2e8f0',
          fontSize: '12px', fontWeight: 600, color: '#0b3c5d'
        }}>
          🚜 Relação de Municípios e Equipamentos Solicitados ({listaEquip.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '600px' }}>
            <thead style={{ background: '#f8fafc', position: 'sticky', top: 0 }}>
              <tr>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Município</th>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Grupo</th>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Equipamento Solicitado</th>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Categoria</th>
                <th align="left" style={{ padding: '6px 10px', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>Prefeito</th>
              </tr>
            </thead>
            <tbody>
              {listaEquip.map((mun, idx) => {
                const corGrupo = mun.cor || '#555';
                return (
                  <tr key={`${mun.ibge}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: corGrupo }}></span>
                        <strong style={{ color: '#22313f' }}>{mun.nome}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '6px 10px', fontSize: '10px', color: '#94a3b8' }}>
                      {mun.grupo === 'Brandão' ? 'Orleans' : mun.grupo === 'Braide' ? 'Braide' : mun.grupo}
                    </td>
                    <td style={{ padding: '6px 10px', color: '#475569' }}>{mun.equipamento_solicitado || '—'}</td>
                    <td style={{ padding: '6px 10px' }}>
                      <span style={{
                        fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                        background: (mun.equipamento_solicitado || '').toLowerCase().includes('trator')
                          ? '#dbeafe' : '#fef3c7',
                        color: (mun.equipamento_solicitado || '').toLowerCase().includes('trator')
                          ? '#1e40af' : '#92400e',
                        fontWeight: 600
                      }}>
                        {(mun.equipamento_solicitado || '').toLowerCase().includes('trator')
                          ? '🚜 Trator Agrícola' : '🚜 Retroescavadeira'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 10px', color: '#475569' }}>{mun.prefeito || '—'}</td>
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
