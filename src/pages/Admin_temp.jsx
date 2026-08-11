import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { Upload, Download, Save, Trash2, RefreshCw } from 'lucide-react';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { formatCurrency } from '../data/municipios';

// Hooks para grupo e busca
const useGrupo = () => useStore(state => state.grupo);
const useBusca = () => useStore(state => state.busca);
const useSetGrupo = () => useStore(state => state.setGrupo);
const useSetBusca = () => useStore(state => state.setBusca);

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

  const grupo = useGrupo();
  const busca = useBusca();

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
    versoes: versions.length,
    braide: municipios.filter(m => m.grupo === 'Braide').length,
    brandao: municipios.filter(m => m.grupo === 'Brandão').length
  };

  const d1Badge = {
    online: { bg: '#dcfce7', color: '#166534', text: '🟢 D1 Online' },
    offline: { bg: '#fef2f2', color: '#991b1b', text: '🔴 D1 Offline' },
    checking: { bg: '#fffbeb', color: '#9a3412', text: '🟡 Conectando...' }
  };

  const hasDuplicatas = municipios.some((m, i, arr) => arr.some((x, j) => i !== j && x.ibge === m.ibge));

  const validarJSON = (newDados) => {
    if (!newDados.municipios || !Array.isArray(newDados.municipios)) {
      throw new Error('Formato inválido: esperado { "municipios": [...] }');
    }
    const required = ['ibge', 'nome', 'grupo', 'cor'];
    const first = newDados.municipios[0];
    const missing = required.filter(k => !(k in first));
    if (missing.length > 0) throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
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
        setIsSaving(true);
        try {
          const resp = await fetch('/api/municipios', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDados)
          });
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          await fetchMunicipios();
          const vr = await fetch('/api/versoes', { credentials: 'include' });
          if (vr.ok) { const vd = await vr.json(); setVersions(vd.versions || []); }
          setUploadStatus(`✅ ${newDados.municipios.length} municípios salvos no D1.`);
        } catch (err) {
          localStorage.setItem('dados_municipios_edited', JSON.stringify(newDados));
          setUploadStatus(`⚠️ Offline — salvo em localStorage.`);
        } finally { setIsSaving(false); }
        const blob = new Blob([JSON.stringify(newDados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'dados_municipios_validado.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        setUploadStatus(`❌ ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const downloadCurrent = () => {
    const data = editedData || { municipios, metadata: { total_municipios: municipios.length } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dados_municipios_atualizado.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const salvarEdicao = async () => {
    if (!editMunicipio || !editedData) return;
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
        apoios_braide: editGrupo === 'Braide' ? 1 : 0,
        apoios_orleans: editGrupo === 'Brandão' ? 1 : 0,
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

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>🔄 Carregando dados do D1... 🗄️</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', paddingBottom: '120px', maxWidth: '100%', margin: '0 auto' }}>

      {/* Status de ação */}
      {uploadStatus && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px',
          background: uploadStatus.includes('✅') ? '#f0fdf4' : uploadStatus.includes('🧹') ? '#f0fdf4' : uploadStatus.includes('⚠️') ? '#fffbeb' : '#fef2f2',
          color: uploadStatus.includes('✅') ? '#166534' : uploadStatus.includes('🧹') ? '#166534' : uploadStatus.includes('⚠️') ? '#9a3412' : '#991b1b',
          border: `1px solid ${uploadStatus.includes('✅') ? '#bbf7d0' : uploadStatus.includes('🧹') ? '#bbf7d0' : uploadStatus.includes('⚠️') ? '#fed7aa' : '#fecaca'}`
        }}>{uploadStatus}</div>
      )}

      {/* ┌──── Resumo Unificado (KPIs + Status BD) ────┐ */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
        padding: '14px 16px', marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0b3c5d', margin: 0 }}>Status do Banco (D1)</h3>
          <span style={{
            padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 600,
            background: d1Badge[d1Status].bg, color: d1Badge[d1Status].color
          }}>{d1Badge[d1Status].text}</span>
        </div>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <StatusChip label="Municípios" value={kpi.total} color="#0b3c5d" />
          <StatusChip label="Obras" value={kpi.obras.toLocaleString()} color="#0b3c5d" />
          <StatusChip label="Braide" value={kpi.braide} color="#E67E22" />
          <StatusChip label="Orleans" value={kpi.brandao} color="#2980B9" />
          <StatusChip label="Versões" value={kpi.versoes} color="#0b3c5d" />
        </div>
      </div>
