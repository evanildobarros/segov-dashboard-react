import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Upload, Download, Save, Trash2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../data/municipios';

const CORES = {
  'Brandão': '#2980B9',
  'Braide': '#E67E22',
  'neutro': '#F1C40F',
  'indefinido': '#BDC3C7',
};

const LABELS = {
  'Brandão': 'Orleans',
  'Braide': 'Braide',
  'neutro': 'Neutro',
  'indefinido': 'Indef.',
};

const grupos = [
  { value: 'Brandão', label: 'Orleans Brandão', cor: '#2980B9' },
  { value: 'Braide', label: 'Braide', cor: '#E67E22' },
  { value: 'neutro', label: 'Empate / Neutro', cor: '#F1C40F' },
  { value: 'indefinido', label: 'Indefinido', cor: '#BDC3C7' }
];

export function AdminPage() {
  const { initTema, municipios, fetchMunicipios, removerDuplicata } = useStore();
  const [uploadStatus, setUploadStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [d1Status, setD1Status] = useState('checking');
  const [editMunicipio, setEditMunicipio] = useState(null);
  const [editGrupo, setEditGrupo] = useState('Brandão');
  const [editObras, setEditObras] = useState('');
  const [editInvestimento, setEditInvestimento] = useState('');
  const [editPrefeito, setEditPrefeito] = useState('');
  const [editPartido, setEditPartido] = useState('');
  const [editDetalhes, setEditDetalhes] = useState('');
  const [editedData, setEditedData] = useState(null);

  useEffect(() => {
    initTema();
    const loadData = async () => {
      setLoading(true);
      setD1Status('checking');
      try {
        await fetchMunicipios();
        setD1Status('online');
        const resp = await fetch('/api/versoes', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setVersions(data.versions || []);
        }
      } catch (e) {
        setD1Status('offline');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [initTema, fetchMunicipios]);

  useEffect(() => {
    if (municipios.length > 0) {
      setEditedData({
        metadata: {
          total_municipios: municipios.length,
          total_obras: municipios.reduce((sum, m) => sum + (m.total_obras || 0), 0),
          total_braide: municipios.filter(m => m.grupo === 'Braide').length,
          total_orleans: municipios.filter(m => m.grupo === 'Brandão').length,
          gerado_em: new Date().toISOString(),
          versao: '3.2 (admin-d1)'
        },
        municipios: municipios
      });
    }
  }, [municipios]);

  const kpi = {
    total: municipios.length,
    obras: municipios.reduce((sum, m) => sum + (m.total_obras || 0), 0),
    braide: municipios.filter(m => m.grupo === 'Braide').length,
    brandao: municipios.filter(m => m.grupo === 'Brandão').length,
    versoes: versions.length
  };

  const hasDuplicatas = municipios.some((m, i, arr) => arr.some((x, j) => i !== j && x.ibge === m.ibge));

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const newDados = JSON.parse(ev.target.result);
        if (!newDados.municipios || !Array.isArray(newDados.municipios)) {
          throw new Error('Formato inválido: esperado { "municipios": [...] }');
        }
        setEditedData(newDados);
        setIsSaving(true);
        try {
          const resp = await fetch('/api/municipios', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDados)
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          await fetchMunicipios();
          setUploadStatus(`✅ Salvo no D1.`);
        } catch {
          localStorage.setItem('dados_municipios_edited', JSON.stringify(newDados));
          setUploadStatus(`⚠️ Offline — faça commit.`);
        } finally { setIsSaving(false); }
        // Download
        const blob = new Blob([JSON.stringify(newDados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dados_municipios_validado.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setUploadStatus(`❌ ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const downloadJSON = () => {
    const data = editedData || { municipios, metadata: { total_municipios: municipios.length } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dados_municipios_atualizado.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const salvarEdicao = async () => {
    if (editMunicipio && editedData) {
      const idx = editedData.municipios.findIndex(m => m.ibge === editMunicipio.ibge);
      if (idx >= 0) {
        editedData.municipios[idx] = {
          ...editedData.municipios[idx],
          grupo: editGrupo,
          cor: grupos.find(g => g.value === editGrupo)?.cor || '#555',
          alinhamento: editGrupo === 'Brandão' ? 'Orleans Brandão' : editGrupo === 'Braide' ? 'Braide' : '',
          total_obras: parseInt(editObras) || 0,
          investimento_planner: editInvestimento || '',
          prefeito: editPrefeito,
          partido: editPartido,
          detalhes: editDetalhes,
          prioritario: ['Braide', 'Brandão'].includes(editGrupo),
        };
        const newData = { ...editedData };
        setEditedData(newData);
        setIsSaving(true);
        try {
          const resp = await fetch('/api/municipios', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          await fetchMunicipios();
          setUploadStatus(`✅ ${editMunicipio.nome} salvo no D1.`);
        } catch (err) {
          setUploadStatus(`⚠️ ${err.message}`);
        } finally { setIsSaving(false); }
      }
    }
    setEditMunicipio(null);
  };

  const handleRemoverDuplicatas = async () => {
    const unicos = municipios.reduce((acc, m) => {
      if (!acc.find(x => x.ibge === m.ibge)) acc.push(m);
      return acc;
    }, []);
    const dados = {
      metadata: {
        total_municipios: unicos.length,
        total_obras: unicos.reduce((sum, m) => sum + (m.total_obras || 0), 0),
        gerado_em: new Date().toISOString()
      },
      municipios: unicos
    };
    try {
      const resp = await fetch('/api/municipios', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      await fetchMunicipios();
      setUploadStatus(`🧹 Duplicatas removidas. ${municipios.length} → ${unicos.length} municípios.`);
    } catch (err) {
      setUploadStatus(`❌ ${err.message}`);
    }
  };

  const handleCancelarEdicao = () => {
    if (editMunicipio) {
      setEditGrupo(editMunicipio.grupo || 'Brandão');
      setEditObras(editMunicipio.total_obras || '');
      setEditInvestimento(editMunicipio.investimento_planner || '');
      setEditPrefeito(editMunicipio.prefeito || '');
      setEditPartido(editMunicipio.partido || '');
      setEditDetalhes(editMunicipio.detalhes || '');
    }
    setEditMunicipio(null);
  };

  // Salva o editedData atual (todas as edições acumuladas) no D1
  const salvarTudo = async () => {
    if (!editedData) return;
    const dados = {
      ...editedData,
      metadata: {
        ...editedData.metadata,
        gerado_em: new Date().toISOString()
      }
    };
    setIsSaving(true);
    try {
      const resp = await fetch('/api/municipios', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      await fetchMunicipios();
      setUploadStatus(`✅ ${dados.municipios.length} municípios salvos no D1.`);
    } catch (err) {
      setUploadStatus(`❌ ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>🔄 Carregando dados do D1... 🗄️</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '140px', maxWidth: '100%', margin: '0 auto' }}>

      {/* ┌─────────────── Resumo Único (KPIs + Status BD) ───────────────┐ */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
        padding: '14px 16px', marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0b3c5d', margin: 0 }}>Status do Banco de Dados</h3>
          <span style={{
            padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 600,
            background: d1Status === 'online' ? '#dcfce7' : d1Status === 'offline' ? '#fef2f2' : '#fffbeb',
            color: d1Status === 'online' ? '#166534' : d1Status === 'offline' ? '#991b1b' : '#9a3412'
          }}>
            {d1Status === 'online' ? '🟢 D1 Online' : d1Status === 'offline' ? '🔴 D1 Offline' : '🟡 Conectando...'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <StatusChip label="Municípios" value={kpi.total} color="#0b3c5d" />
          <StatusChip label="Obras" value={kpi.obras.toLocaleString()} color="#0b3c5d" />
          <StatusChip label="Braide" value={kpi.braide} color="#E67E22" />
          <StatusChip label="Orleans" value={kpi.brandao} color="#2980B9" />
          <StatusChip label="Versões" value={kpi.versoes} color="#0b3c5d" />
        </div>
      </div>

      {/* Status de ação */}
      {uploadStatus && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px',
          background: uploadStatus.includes('✅') ? '#f0fdf4' : uploadStatus.includes('🧹') ? '#f0fdf4' : uploadStatus.includes('⚠️') ? '#fffbeb' : '#fef2f2',
          color: uploadStatus.includes('✅') ? '#166534' : uploadStatus.includes('🧹') ? '#166534' : uploadStatus.includes('⚠️') ? '#9a3412' : '#991b1b',
          border: `1px solid ${uploadStatus.includes('✅') ? '#bbf7d0' : uploadStatus.includes('🧹') ? '#bbf7d0' : uploadStatus.includes('⚠️') ? '#fed7aa' : '#fecaca'}`
        }}>
          {uploadStatus}
        </div>
      )}

      {/* ┌─────────────── Lista de Municípios ───────────────┐ */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '80px' }}>
        <div style={{
          background: '#f8fafc', padding: '8px 12px',
          borderBottom: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 600, color: '#0b3c5d'
        }}>
          Municípios ({municipios.length})
          {hasDuplicatas && <span style={{ fontSize: '10px', color: '#ef4444', marginLeft: '6px' }}>⚠️ {municipios.filter((m,i,a)=>a.filter(x=>x.ibge===m.ibge).length>1).length} duplicatas</span>}
          {versions.length > 0 && (
            <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '8px' }}>
              • Última: {new Date(versions[0].created_at).toLocaleDateString()}
            </span>
          )}
        </div>
        <div style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
          {municipios.map((mun, idx) => {
            const corGrupo = CORES[mun.grupo] || '#555';
            const isDuplicata = municipios.filter(m => m.ibge === mun.ibge).length > 1;
            return (
              <div
                key={`${mun.ibge}-${idx}`}
                style={{
                  padding: '6px 10px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: isDuplicata ? '#fff5f5' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: corGrupo, flexShrink: 0 }}></span>
                  <strong style={{ color: '#22313f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mun.nome}</strong>
                  {isDuplicata && <span style={{ color: '#ef4444', fontSize: '10px' }}>⚠️</span>}
                  <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>{LABELS[mun.grupo] || mun.grupo}</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {isDuplicata && (
                    <button
                      onClick={handleRemoverDuplicatas}
                      style={{
                        padding: '2px 6px', border: '1px solid #ef4444',
                        background: '#fef2f2', borderRadius: '4px',
                        cursor: 'pointer', fontSize: '10px', color: '#dc2626',
                        minWidth: '56px'
                      }}
                      title="Remover todas duplicatas"
                    >
                      Excluir
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditMunicipio(mun);
                      setEditGrupo(mun.grupo || 'Brandão');
                      setEditObras(mun.total_obras || '');
                      setEditInvestimento(mun.investimento_planner || '');
                      setEditPrefeito(mun.prefeito || '');
                      setEditPartido(mun.partido || '');
                      setEditDetalhes(mun.detalhes || '');
                    }}
                    style={{
                      padding: '2px 6px', border: '1px solid #e2e8f0',
                      background: '#f8fafc', borderRadius: '4px',
                      cursor: 'pointer', fontSize: '10px', color: '#475569',
                      minWidth: '56px'
                    }}
                    title="Editar"
                  >
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ┌─────────────── Botões Fixos (Bottom) ───────────────┐ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', borderTop: '1px solid #e2e8f0',
        padding: '12px 16px', display: 'flex', gap: '10px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
        zIndex: 1000
      }}>
        <input
          type="file"
          accept=".json,application/json"
          onChange={handleUpload}
          id="upload-input"
          style={{ display: 'none' }}
        />
        <label htmlFor="upload-input" style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '6px', cursor: 'pointer',
          background: '#0b3c5d', color: 'white', border: 'none',
          padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600
        }}>
          <Upload size={14} />
          Upload
        </label>

        <button
          onClick={handleRemoverDuplicatas}
          disabled={isSaving}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', cursor: 'pointer',
            background: hasDuplicatas ? '#fef2f2' : '#f1f5f9',
            color: hasDuplicatas ? '#dc2626' : '#94a3b8',
            border: `1px solid ${hasDuplicatas ? '#ef4444' : '#e2e8f0'}`,
            padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            opacity: hasDuplicatas ? 1 : 0.6
          }}
          title={hasDuplicatas ? 'Remover municípios duplicados' : 'Sem duplicatas para remover'}
        >
          {isSaving ? <RefreshCw size={14} /> : <Trash2 size={14} />}
          Excluir Dup.
        </button>

        <button
          onClick={() => editMunicipio ? salvarEdicao() : salvarTudo()}
          disabled={isSaving}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', cursor: 'pointer',
            background: editMunicipio ? '#2980B9' : (hasDuplicatas ? '#f59e0b' : '#2980B9'),
            color: 'white', border: 'none',
            padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
            opacity: isSaving ? 0.7 : 1
          }}
          title="Salvar alterações no D1"
        >
          {isSaving ? <RefreshCw size={14} /> : <Save size={14} />}
          Salvar
        </button>

        <button
          onClick={downloadJSON}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', cursor: 'pointer',
            background: '#10b981', color: 'white', border: 'none',
            padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600
          }}
        >
          <Download size={14} />
          Download
        </button>

        <button
          onClick={() => fetchMunicipios()}
          style={{
            flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0',
            padding: '10px', borderRadius: '8px', fontSize: '12px'
          }}
          title="Atualizar"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {editMunicipio && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'flex-end', zIndex: 2000
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px 16px 0 0',
            padding: '20px', width: '100%', maxWidth: '420px',
            margin: '0 auto', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#0b3c5d' }}>Editar: {editMunicipio.nome}</h3>
              <button onClick={() => setEditMunicipio(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Grupo</label>
                <select value={editGrupo} onChange={(e) => setEditGrupo(e.target.value)} style={{ width: '100%', padding: '7px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }}>
                  {grupos.map(g => (<option key={g.value} value={g.value}>{g.label}</option>))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Total Obras</label>
                <input type="number" value={editObras} onChange={(e) => setEditObras(e.target.value)} style={{ width: '100%', padding: '7px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Investimento</label>
                <input type="text" value={editInvestimento} onChange={(e) => setEditInvestimento(e.target.value)} style={{ width: '100%', padding: '7px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }} placeholder="R$ 1.000.000,00" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Prefeito</label>
                <input type="text" value={editPrefeito} onChange={(e) => setEditPrefeito(e.target.value)} style={{ width: '100%', padding: '7px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Partido</label>
                <input type="text" value={editPartido} onChange={(e) => setEditPartido(e.target.value)} style={{ width: '100%', padding: '7px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Detalhes</label>
                <input type="text" value={editDetalhes} onChange={(e) => setEditDetalhes(e.target.value)} style={{ width: '100%', padding: '7px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={salvarEdicao} style={{ flex: 1, background: '#2980B9', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                Salvar no D1
              </button>
              <button onClick={handleCancelarEdicao} style={{ flex: 1, background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusChip({ label, value, color }) {
  return (
    <div style={{
      background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: '8px', padding: '6px 10px', minWidth: '70px'
    }}>
      <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
