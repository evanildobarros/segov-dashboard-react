import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Upload, Download, RefreshCw, MapPin, Save, Tag, BarChart3 } from 'lucide-react';
import { formatCurrency } from '../data/municipios';

const CORES = {
  'Brandão': '#2980B9',
  'Braide': '#E67E22',
  'neutro': '#F1C40F',
  'indefinido': '#BDC3C7',
};

const LABELS = {
  'Brandão': 'Orleans Brandão',
  'Braide': 'Braide',
  'neutro': 'Empate / Neutro',
  'indefinido': 'Indefinido',
};

const grupos = [
  { value: 'Brandão', label: 'Orleans Brandão', cor: '#2980B9' },
  { value: 'Braide', label: 'Braide', cor: '#E67E22' },
  { value: 'neutro', label: 'Empate / Neutro', cor: '#F1C40F' },
  { value: 'indefinido', label: 'Indefinido', cor: '#BDC3C7' }
];

export function AdminPage() {
  const { setMunicipioId, initTema, municipios, fetchMunicipios } = useStore();
  const [uploadStatus, setUploadStatus] = useState('');
  const [lastModified, setLastModified] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para edição de município
  const [editMunicipio, setEditMunicipio] = useState(null);
  const [editGrupo, setEditGrupo] = useState('Braide');
  const [editObras, setEditObras] = useState('');
  const [editInvestimento, setEditInvestimento] = useState('');
  const [editPrefeito, setEditPrefeito] = useState('');
  const [editPartido, setEditPartido] = useState('');
  const [editDetalhes, setEditDetalhes] = useState('');

  // Estado para o JSON editado
  const [editedData, setEditedData] = useState(null);

  // Carrega dados do D1 ao montar
  useEffect(() => {
    initTema();
    const loadData = async () => {
      setLoading(true);
      try {
        // Força refresh da store do D1
        await fetchMunicipios();
        // Carrega versões do D1
        const resp = await fetch('/api/versoes', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          setVersions(data.versions || []);
        }
      } catch (e) {
        console.error('Admin load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [initTema, fetchMunicipios]);

  // Mantém editedData sincronizado com municipios da store
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
      setLastModified(municipios[0]?.last_modified || 'D1');
    }
  }, [municipios]);

  const validarJSON = (newDados) => {
    if (!newDados.municipios || !Array.isArray(newDados.municipios)) {
      throw new Error('Formato inválido: esperado { "municipios": [...] }');
    }
    const required = ['ibge', 'nome', 'grupo', 'cor'];
    const first = newDados.municipios[0];
    const missing = required.filter(k => !(k in first));
    if (missing.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const newDados = JSON.parse(ev.target.result);
        validarJSON(newDados);
        setEditedData(newDados);

        const count = newDados.municipios.length;
        const obras = (newDados.metadata?.total_obras || 0);

        // Salva no D1 via API
        setIsSaving(true);
        try {
          const response = await fetch('/api/municipios', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDados)
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          setUploadStatus(`✅ ${count} municípios, ${obras} obras salvo no D1.`);
          setLastModified(new Date().toISOString());
          await fetchMunicipios(); // Refresh store
        } catch (apiErr) {
          // Fallback
          localStorage.setItem('dados_municipios_edited', JSON.stringify(newDados, null, 2));
          setUploadStatus(`⚠️ ${count} municípios carregados (offline).`);
        } finally {
          setIsSaving(false);
        }

        // Gera download validado
        const blob = new Blob([JSON.stringify(newDados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dados_municipios_validado.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setUploadStatus(`❌ Erro: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const downloadCurrent = () => {
    const data = editedData || { municipios: municipios, metadata: { total_municipios: municipios.length } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dados_municipios_atualizado.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const salvarEdicao = async () => {
    if (editMunicipio && editedData) {
      const idx = editedData.municipios.findIndex(m => m.ibge === editMunicipio.ibge);
      if (idx >= 0) {
        const updated = {
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
          apoios_braide: editGrupo === 'Braide' ? 1 : 0,
          apoios_orleans: editGrupo === 'Brandão' ? 1 : 0,
        };
        editedData.municipios[idx] = updated;
        const newData = { ...editedData };
        setEditedData(newData);

        // Salva no D1 via API
        setIsSaving(true);
        try {
          const response = await fetch('/api/municipios', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newData)
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          await fetchMunicipios(); // Refresh store
          setUploadStatus(`✅ ${editMunicipio.nome} atualizado como ${grupos.find(g => g.value === editGrupo)?.label} e salvo no D1.`);
        } catch (err) {
          setUploadStatus(`⚠️ ${editMunicipio.nome} atualizado localmente. Salve no D1: ${err.message}`);
        } finally {
          setIsSaving(false);
        }
      }
    }
    setEditMunicipio(null);
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

  const gruposExibicao = ['Brandão', 'Braide', 'neutro', 'indefinido'];

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>🔄 Carregando dados do D1... 🗄️</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', maxWidth: '700px', margin: '0 auto' }}>

      {/* === Upload JSON === */}
      <div style={{
        background: '#fff', border: '2px dashed #0b3c5d', borderRadius: '12px',
        padding: '24px', textAlign: 'center', marginBottom: '20px'
      }}>
        <input
          type="file"
          accept='.json,application/json'
          onChange={handleUpload}
          id="upload-input"
          style={{ display: 'none' }}
        />
        <label htmlFor="upload-input" style={{ cursor: 'pointer' }}>
          <Upload size={24} style={{ marginBottom: '8px', color: '#0b3c5d' }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0b3c5d', marginBottom: '4px' }}>
            Selecionar dados_municipios.json
          </div>
          <div style={{ fontSize: '11px', color: '#7a8a99' }}>
            Upload do JSON oficial → Salva no D1
          </div>
        </label>
        {isSaving && <div style={{ marginTop: '8px', fontSize: '12px', color: '#e67e22' }}>Salvando no D1...</div>}
      </div>

      {/* === Status === */}
      {uploadStatus && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px',
          marginBottom: '16px', fontSize: '12px',
          background: uploadStatus.includes('✅') ? '#f0fdf4' : uploadStatus.includes('⚠️') ? '#fffbeb' : '#fef2f2',
          color: uploadStatus.includes('✅') ? '#166534' : uploadStatus.includes('⚠️') ? '#9a3412' : '#991b1b',
          border: `1px solid ${uploadStatus.includes('✅') ? '#bbf7d0' : uploadStatus.includes('⚠️') ? '#fed7aa' : '#fecaca'}`
        }}>
          {uploadStatus}
        </div>
      )}

      {/* === Download === */}
      <div style={{
        background: '#fff', border: '1px solid #dde3ea', borderRadius: '12px',
        padding: '16px', marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0b3c5d', marginBottom: '8px' }}>
          Download Atual (D1)
        </div>
        <button
          onClick={downloadCurrent}
          style={{
            background: '#10b981', color: 'white', border: 'none',
            padding: '10px 16px', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            width: '100%'
          }}
        >
          <Download size={16} style={{ marginRight: '6px' }} />
          Baixar dados_municipios.json
        </button>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
          Fonte: 🗄️ D1 Database | Última atualização: {lastModified}
        </div>
        {versions.length > 0 && (
          <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
            📦 {versions.length} versão(ões) salva(s) no D1
            <a href="#versoes" style={{ marginLeft: '8px', color: '#2980B9' }}>(ver histórico ↓)</a>
          </div>
        )}
      </div>

      {/* === Histórico Versões D1 === */}
      <div style={{
        background: '#fff', border: '1px solid #dde3ea', borderRadius: '12px',
        padding: '16px', marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0b3c5d', marginBottom: '10px' }}>
          📊 Histórico de Versões (D1)
        </div>
        {versions.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>Nenhuma versão salva ainda. Faça upload ou edite um município.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th align="left" style={{ padding: '6px 10px' }}>Data</th>
                <th align="right" style={{ padding: '6px 10px' }}>Municípios</th>
                <th align="right" style={{ padding: '6px 10px' }}>Obras</th>
                <th align="left" style={{ padding: '6px 10px' }}>Usuário</th>
              </tr>
            </thead>
            <tbody>
              {versions.map(v => (
                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 10px', color: '#475569' }}>{new Date(v.created_at).toLocaleString()}</td>
                  <td align="right" style={{ padding: '6px 10px' }}>{v.total_municipios}</td>
                  <td align="right" style={{ padding: '6px 10px' }}>{v.total_obras}</td>
                  <td style={{ padding: '6px 10px', color: '#475569' }}>{v.actor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* === Workflow === */}
      <div style={{
        background: '#fff', border: '1px solid #dde3ea', borderRadius: '12px',
        padding: '16px', marginBottom: '24px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0b3c5d', marginBottom: '10px' }}>
          Fluxo de Atualização de Dados Políticos
        </div>
        <ol style={{ paddingLeft: '18px', fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>
          <li>Upload JSON → salva no D1 (via API POST /api/municipios)</li>
          <li>Edição rápida de municípios — salva no D1 em tempo real</li>
          <li>Histórico de versões listado via GET /api/versoes</li>
          <li>Download JSON sempre reflete o último estado do D1</li>
        </ol>
      </div>

      {/* === Data Table === */}
      <div style={{
        background: '#fff', border: '1px solid #dde3ea', borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: '#f8fafc', padding: '10px 14px',
          borderBottom: '1px solid #e2e8f0', fontSize: '13px', fontWeight: 600, color: '#0b3c5d'
        }}>
          Todos os Municípios ({municipios.length})
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {municipios.map((mun, idx) => {
            const corGrupo = CORES[mun.grupo] || '#555';
            return (
              <div
                key={mun.ibge}
                style={{
                  padding: '8px 12px', borderBottom: '1px solid #f1f5f9',
                  display: 'grid', gridTemplateColumns: '1fr 90px 60px 100px',
                  fontSize: '11.5px', alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: corGrupo, display: 'inline-block', marginRight: '4px' }}></span>
                  <strong style={{ color: '#22313f' }}>{mun.nome}</strong>
                </div>
                <span style={{ color: '#475569' }}>{(LABELS[mun.grupo] || mun.grupo).replace('Orleans Brandão', 'Brandão')}</span>
                <span style={{ color: '#475569' }}>{mun.total_obras || 0}</span>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
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
                      padding: '3px 8px', border: '1px solid #e2e8f0',
                      background: '#f8fafc', borderRadius: '5px',
                      cursor: 'pointer', fontSize: '11px'
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

      {/* === Modal Edição Rápida === */}
      {editMunicipio && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: '12px',
            padding: '20px', width: '90%', maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '16px', color: '#0b3c5d' }}>
              Editar: {editMunicipio.nome}
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Grupo</label>
                <select
                  value={editGrupo}
                  onChange={(e) => setEditGrupo(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }}
                >
                  {grupos.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Total Obras</label>
                <input
                  type="number"
                  value={editObras}
                  onChange={(e) => setEditObras(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Investimento</label>
                <input
                  type="text"
                  value={editInvestimento}
                  onChange={(e) => setEditInvestimento(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }}
                  placeholder="R$ 1.000.000,00"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Prefeito</label>
                <input
                  type="text"
                  value={editPrefeito}
                  onChange={(e) => setEditPrefeito(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Partido</label>
                <input
                  type="text"
                  value={editPartido}
                  onChange={(e) => setEditPartido(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Detalhes</label>
                <input
                  type="text"
                  value={editDetalhes}
                  onChange={(e) => setEditDetalhes(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #dde3ea', borderRadius: '6px', fontSize: '12px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={salvarEdicao}
                style={{ flex: 1, background: '#2980B9', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Save size={14} style={{ marginRight: '4px' }} /> Salvar no D1
              </button>
              <button
                onClick={handleCancelarEdicao}
                style={{ flex: 1, background: 'transparent', color: '#64748b', border: '1px solid #e2e8f0', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Versões D1 (anchor) === */}
      <div id="versoes" style={{ height: '1px' }}></div>
    </div>
  );
}
