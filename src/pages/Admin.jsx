import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { Upload, Download, Trash2, RefreshCw, Plus } from 'lucide-react';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
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

const GRUPOS = [
  { value: 'Brandão', label: 'Orleans Brandão', cor: '#2980B9' },
  { value: 'Braide', label: 'Braide', cor: '#E67E22' },
  { value: 'neutro', label: 'Empate / Neutro', cor: '#F1C40F' },
  { value: 'indefinido', label: 'Indefinido', cor: '#BDC3C7' },
];

const GRUPO_OPTIONS = [
  { value: 'Brandão', label: 'Orleans Brandão' },
  { value: 'Braide', label: 'Braide' },
  { value: 'neutro', label: 'Empate / Neutro' },
  { value: 'indefinido', label: 'Indefinido' },
];

const FEEDBACK_STYLES = {
  success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '🟢' },
  error: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '🔴' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: '🟡' },
  info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: '🔵' },
};

const D1_BADGE_STYLES = {
  online: { bg: 'bg-green-100', text: 'text-green-800', label: '🟢 D1 Online' },
  offline: { bg: 'bg-red-100', text: 'text-red-800', label: '🔴 D1 Offline' },
  checking: { bg: 'bg-amber-100', text: 'text-amber-800', label: '🟡 Conectando...' },
};

/* ─── Modal de Edição ─── */
function EditModal({ municipio, editFormData, setEditFormData, isSaving, onSave, onCancel }) {
  const handleFieldChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <h3 className="text-lg font-semibold text-gray-900">Editar: {municipio.nome}</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="p-6 space-y-8">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-4">Dados do Município</h4>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-x-6 gap-y-6">
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">Código IBGE</label>
                <input type="text" value={municipio.ibge} readOnly
                  className="mt-1 block w-full rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700" />
              </div>
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input type="text" value={municipio.nome} readOnly
                  className="mt-1 block w-full rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Alinhamento</label>
                <div className="mt-1 relative">
                  <select value={editFormData.grupo} onChange={(e) => handleFieldChange('grupo', e.target.value)}
                    className="appearance-none w-full rounded-md bg-white py-1.5 pr-8 pl-3 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600">
                    {GRUPO_OPTIONS.map(g => (<option key={g.value} value={g.value}>{g.label}</option>))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                </div>
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Total Obras</label>
                <input type="number" value={editFormData.total_obras} onChange={(e) => handleFieldChange('total_obras', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
              </div>
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Investimento Planner</label>
                <input type="text" value={editFormData.investimento_planner} onChange={(e) => handleFieldChange('investimento_planner', e.target.value)} placeholder="R$ 1.000.000,00"
                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
              </div>
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Prefeito</label>
                <input type="text" value={editFormData.prefeito} onChange={(e) => handleFieldChange('prefeito', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Partido</label>
                <input type="text" value={editFormData.partido} onChange={(e) => handleFieldChange('partido', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-gray-700">Detalhes</label>
                <input type="text" value={editFormData.detalhes} onChange={(e) => handleFieldChange('detalhes', e.target.value)}
                  className="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={isSaving}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-60">
              {isSaving ? 'Salvando...' : 'Salvar no D1'}
            </button>
            <button type="button" onClick={() => {
              if (window.confirm(`Excluir ${municipio.nome} (${municipio.ibge}) do D1?`)) {
                onDelete(municipio.ibge);
              }
            }} className="flex-1 bg-red-100 text-red-700 py-2 px-4 rounded-md font-medium hover:bg-red-200">
              Excluir
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Modal de Novo Município ─── */
function NewMunicipioModal({ newMunicipio, setNewMunicipio, isSaving, onCreate, onCancel }) {
  const handleChange = (field, value) => {
    setNewMunicipio(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <h3 className="text-lg font-semibold text-gray-900">Novo Município</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onCreate(); }} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código IBGE *</label>
              <input type="text" value={newMunicipio.ibge} onChange={(e) => handleChange('ibge', e.target.value)}
                placeholder="2100055" maxLength="7" required
                className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome do Município *</label>
              <input type="text" value={newMunicipio.nome} onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Ex: Açailândia" required
                className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Grupo Político</label>
              <div className="mt-1 relative">
                <select value={newMunicipio.grupo} onChange={(e) => handleChange('grupo', e.target.value)}
                  className="appearance-none w-full rounded-md bg-white py-2 pr-8 pl-3 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600">
                  {GRUPO_OPTIONS.map(g => (<option key={g.value} value={g.value}>{g.label}</option>))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Total de Obras</label>
              <input type="number" value={newMunicipio.total_obras} onChange={(e) => handleChange('total_obras', e.target.value)}
                placeholder="0" min="0"
                className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Investimento (PLANNER)</label>
              <input type="text" value={newMunicipio.investimento_planner} onChange={(e) => handleChange('investimento_planner', e.target.value)}
                placeholder="R$ 1.000.000,00"
                className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Prefeito</label>
              <input type="text" value={newMunicipio.prefeito} onChange={(e) => handleChange('prefeito', e.target.value)}
                placeholder="Nome do prefeito"
                className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Partido</label>
              <input type="text" value={newMunicipio.partido} onChange={(e) => handleChange('partido', e.target.value)}
                placeholder="Ex: PL, MDB, PSD"
                className="mt-1 block w-full rounded-md bg-white px-3 py-2 text-sm text-gray-900 outline outline-gray-300 focus:outline-2 focus:outline-indigo-600" />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={isSaving}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md font-medium hover:bg-green-700 disabled:opacity-60">
              {isSaving ? 'Inserindo...' : 'Inserir no D1'}
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Componente Principal ─── */
export function AdminPage() {
  const { initTema, municipios, fetchMunicipios, removerDuplicata, excluirMunicipio, getMunicipiosFiltrados, setSort } = useStore();
  const { grupo, setGrupo, busca, setBusca } = useStore();

  const [feedback, setFeedback] = useState({ type: null, message: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [d1Status, setD1Status] = useState('checking');
  const [editMunicipio, setEditMunicipio] = useState(null);
  const [showNewMunicipio, setShowNewMunicipio] = useState(false);
  const [newMunicipio, setNewMunicipio] = useState({
    ibge: '', nome: '', grupo: 'Brandão', total_obras: 0,
    investimento_planner: '', prefeito: '', partido: ''
  });
  const [editFormData, setEditFormData] = useState({
    grupo: 'Brandão', total_obras: '', investimento_planner: '',
    prefeito: '', partido: '', detalhes: ''
  });
  const [editedData, setEditedData] = useState(null);

  useEffect(() => {
    initTema();
    const loadData = async () => {
      setLoading(true);
      setD1Status('checking');
      try {
        await fetchMunicipios();
        // Sort by nome (alfabética) by default
        setSort('nome', 'asc');
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
  }, [initTema, fetchMunicipios, setSort]);

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

  const municipiosFiltrados = getMunicipiosFiltrados();

  const kpi = useMemo(() => ({
    total: municipiosFiltrados.length,
    obras: municipiosFiltrados.reduce((sum, m) => sum + (m.total_obras || 0), 0),
    versoes: versions.length,
    braide: municipiosFiltrados.filter(m => m.grupo === 'Braide').length,
    brandao: municipiosFiltrados.filter(m => m.grupo === 'Brandão').length,
  }), [municipiosFiltrados, versions.length]);

  const hasDuplicatas = useMemo(() =>
    municipiosFiltrados.some((m, i, arr) => arr.some((x, j) => i !== j && x.ibge === m.ibge)),
    [municipiosFiltrados]
  );

  const dupCount = useMemo(() =>
    municipiosFiltrados.filter((m, i, arr) => arr.some(x => x.ibge === m.ibge && x !== m)).length,
    [municipiosFiltrados]
  );

  const validarJSON = useCallback((newDados) => {
    if (!newDados.municipios || !Array.isArray(newDados.municipios)) {
      throw new Error('Formato inválido: esperado { "municipios": [...] }');
    }
    const required = ['ibge', 'nome', 'grupo', 'cor'];
    const first = newDados.municipios[0];
    const missing = required.filter(k => !(k in first));
    if (missing.length > 0) throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
  }, []);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    if (type !== 'info') {
      setTimeout(() => setFeedback({ type: null, message: '' }), 6000);
    }
  }, []);

  const handleUpload = useCallback((e) => {
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
          showFeedback('success', `${newDados.municipios.length} municípios salvos no D1.`);
        } catch (err) {
          localStorage.setItem('dados_municipios_edited', JSON.stringify(newDados));
          showFeedback('warning', `Offline — salvo em localStorage.`);
        } finally { setIsSaving(false); }
        const blob = new Blob([JSON.stringify(newDados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'dados_municipios_validado.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        showFeedback('error', err.message);
      }
    };
    reader.readAsText(file);
  }, [validarJSON, fetchMunicipios, showFeedback]);

  const downloadCurrent = useCallback(() => {
    const data = editedData || { municipios, metadata: { total_municipios: municipios.length } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'dados_municipios_atualizado.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [editedData, municipios]);

  const salvarEdicao = useCallback(async () => {
    if (!editMunicipio || !editedData) return;
    const idx = editedData.municipios.findIndex(m => m.ibge === editMunicipio.ibge);
    if (idx < 0) return;

    editedData.municipios[idx] = {
      ...editedData.municipios[idx],
      grupo: editFormData.grupo,
      cor: GRUPOS.find(g => g.value === editFormData.grupo)?.cor || '#555',
      alinhamento: editFormData.grupo === 'Brandão' ? 'Orleans Brandão' : editFormData.grupo === 'Braide' ? 'Braide' : '',
      total_obras: parseInt(editFormData.total_obras) || 0,
      investimento_planner: editFormData.investimento_planner || '',
      prefeito: editFormData.prefeito,
      partido: editFormData.partido,
      detalhes: editFormData.detalhes,
      prioritario: ['Braide', 'Brandão'].includes(editFormData.grupo),
      apoios_braide: editFormData.grupo === 'Braide' ? 1 : 0,
      apoios_orleans: editFormData.grupo === 'Brandão' ? 1 : 0,
    };

    setEditedData({ ...editedData });
    setIsSaving(true);
    try {
      const resp = await fetch('/api/municipios', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      await fetchMunicipios();
      showFeedback('success', `${editMunicipio.nome} salvo no D1.`);
    } catch (err) {
      showFeedback('error', err.message);
    } finally { setIsSaving(false); }
    setEditMunicipio(null);
  }, [editMunicipio, editedData, editFormData, fetchMunicipios, showFeedback]);

  const handleCancelarEdicao = useCallback(() => {
    if (editMunicipio) {
      setEditFormData({
        grupo: editMunicipio.grupo || 'Brandão',
        total_obras: editMunicipio.total_obras || '',
        investimento_planner: editMunicipio.investimento_planner || '',
        prefeito: editMunicipio.prefeito || '',
        partido: editMunicipio.partido || '',
        detalhes: editMunicipio.detalhes || '',
      });
    }
    setEditMunicipio(null);
  }, [editMunicipio]);

  const handleNovoMunicipio = useCallback(async () => {
    if (!newMunicipio.ibge || !newMunicipio.nome.trim()) {
      showFeedback('warning', 'IBGE e Nome são obrigatórios');
      return;
    }
    const exists = municipios.find(m => m.ibge === newMunicipio.ibge);
    if (exists) {
      showFeedback('warning', `IBGE ${newMunicipio.ibge} já existe: ${exists.nome}`);
      return;
    }

    setIsSaving(true);
    try {
      const resp = await fetch('/api/municipios/new', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ibge: newMunicipio.ibge,
          nome: newMunicipio.nome.trim(),
          grupo: newMunicipio.grupo,
          total_obras: parseInt(newMunicipio.total_obras) || 0,
          investimento_planner: newMunicipio.investimento_planner || '',
          prefeito: newMunicipio.prefeito || '',
          partido: newMunicipio.partido || ''
        })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.erro || `HTTP ${resp.status}`);
      }
      await fetchMunicipios();
      showFeedback('success', `${newMunicipio.nome} (${newMunicipio.ibge}) inserido no D1`);
      setShowNewMunicipio(false);
      setNewMunicipio({ ibge: '', nome: '', grupo: 'Brandão', total_obras: 0, investimento_planner: '', prefeito: '', partido: '' });
    } catch (err) {
      showFeedback('error', err.message);
    } finally { setIsSaving(false); }
  }, [newMunicipio, municipios, fetchMunicipios, showFeedback]);

  const handleEditClick = useCallback((mun) => {
    setEditMunicipio(mun);
    setEditFormData({
      grupo: mun.grupo || 'Brandão',
      total_obras: mun.total_obras || '',
      investimento_planner: mun.investimento_planner || '',
      prefeito: mun.prefeito || '',
      partido: mun.partido || '',
      detalhes: mun.detalhes || '',
    });
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        🔄 Carregando dados do D1... 🗄️
      </div>
    );
  }

  const feedbackStyle = feedback.type ? FEEDBACK_STYLES[feedback.type] : null;

  return (
    <div className="p-3 max-w-full mx-auto">

      {/* ─── Feedback Alert ─── */}
      {feedback.type && feedbackStyle && (
        <div className={`${feedbackStyle.bg} ${feedbackStyle.border} ${feedbackStyle.text} border px-4 py-3 rounded-lg mb-3 text-sm flex items-center gap-2`}>
          <span>{feedbackStyle.icon}</span>
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback({ type: null, message: '' })} className="ml-auto text-current opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* ─── Resumo Unificado (KPIs + Status BD) ─── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-[#0b3c5d] m-0">Status do Banco (D1)</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${D1_BADGE_STYLES[d1Status].bg} ${D1_BADGE_STYLES[d1Status].text}`}>
            {D1_BADGE_STYLES[d1Status].label}
          </span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <StatusChip label="Municípios" value={kpi.total} color="#0b3c5d" />
          <StatusChip label="Obras" value={kpi.obras.toLocaleString()} color="#0b3c5d" />
          <StatusChip label="Braide" value={kpi.braide} color="#E67E22" />
          <StatusChip label="Orleans" value={kpi.brandao} color="#2980B9" />
          <StatusChip label="Versões" value={kpi.versoes} color="#0b3c5d" />
        </div>
      </div>

      {/* ─── Tabela de Municípios ─── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="bg-gray-50 px-3 py-2.5 border-b border-gray-200 flex items-center justify-between gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#0b3c5d]">Municípios ({municipiosFiltrados.length})</span>
            {hasDuplicatas && <span className="text-[10px] text-red-500">⚠️ {dupCount} dup</span>}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setShowNewMunicipio(true)}
              className="flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white border-none py-1.5 px-3 rounded-lg text-xs font-semibold">
              <Plus size={13} /> Novo
            </button>
            <input type="file" accept=".json,application/json" onChange={handleUpload} id="upload-input" className="hidden" />
            <label htmlFor="upload-input" className="flex items-center gap-1.5 cursor-pointer bg-[#0b3c5d] text-white border-none py-1.5 px-3 rounded-lg text-xs font-semibold">
              <Upload size={13} /> Upload
            </label>
            <button onClick={downloadCurrent}
              className="flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white border-none py-1.5 px-3 rounded-lg text-xs font-semibold">
              <Download size={13} /> Download
            </button>
          </div>
        </div>

        {/* Filtros da Tabela */}
        <div className="bg-white px-3 py-2.5 border-b border-gray-100 flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-gray-400 whitespace-nowrap">GRUPO:</span>
            {['todos', 'Brandão', 'Braide', 'neutro', 'indefinido'].map(g => (
              <button key={g} onClick={() => setGrupo(g)}
                className={`px-3 py-1 rounded-full cursor-pointer border text-[11px] font-semibold transition-all ${
                  grupo === g ? 'bg-[#0b3c5d] text-white border-[#0b3c5d]' : 'bg-white text-[#22313f] border-gray-300'
                }`}>
                {g === 'todos' ? '☰ Todos' : g === 'Brandão' ? '🔵 Orleans' : g === 'Braide' ? '🟠 Braide' : g === 'neutro' ? '🟡 Neutro' : '⚪ Indefinido'}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <input type="text" placeholder="🔍 Buscar município ou prefeito..." value={busca} onChange={(e) => setBusca(e.target.value)}
              className="w-56 max-w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-[#22313f]" />
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs min-w-[700px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-2.5 border-b border-gray-200 text-gray-500 text-left">IBGE</th>
                <th className="p-2.5 border-b border-gray-200 text-gray-500 text-left cursor-pointer select-none"
                    onClick={() => {
                      const currentKey = useStore.getState().sortKey;
                      const currentDir = useStore.getState().sortDir;
                      if (currentKey === 'nome') {
                        setSort('nome', currentDir === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSort('nome', 'asc');
                      }
                    }}>
                    Município
                    {(() => {
                      const sk = useStore.getState().sortKey;
                      const sd = useStore.getState().sortDir;
                      if (sk === 'nome') {
                        return sd === 'asc' ? ' ▲' : ' ▼';
                      }
                      return ' ↕';
                    })()}
                  </th>
                <th className="p-2.5 border-b border-gray-200 text-gray-500 text-left">Grupo</th>
                <th className="p-2.5 border-b border-gray-200 text-gray-500 text-right">Obras</th>
                <th className="p-2.5 border-b border-gray-200 text-gray-500 text-left">Investimento</th>
                <th className="p-2.5 border-b border-gray-200 text-gray-500 text-left">Prefeito</th>
                <th className="p-2.5 border-b border-gray-200 text-gray-500 text-left">Partido</th>
                <th className="p-2.5 border-b border-gray-200 text-gray-500 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {municipiosFiltrados.map((mun, idx) => {
                const corGrupo = CORES[mun.grupo] || '#555';
                const isDuplicata = municipiosFiltrados.some((x, j) => j !== idx && x.ibge === mun.ibge);
                return (
                  <tr key={`${mun.ibge}-${idx}`} className={`border-b border-gray-100 ${isDuplicata ? 'bg-red-50' : 'bg-white'}`}>
                    <td className="p-2.5 text-gray-400 text-[10px] font-mono">{mun.ibge}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1">
                        <span className="w-[5px] h-[5px] rounded-full inline-block" style={{ background: corGrupo }}></span>
                        <strong className="text-[#22313f]">{mun.nome}</strong>
                        {isDuplicata && <span className="text-red-500">⚠️</span>}
                      </div>
                    </td>
                    <td className="p-2.5"><span className="text-[10px] text-gray-400">{LABELS[mun.grupo] || mun.grupo}</span></td>
                    <td className="p-2.5 text-right text-[#475569]">{mun.total_obras || 0}</td>
                    <td className="p-2.5 text-[#475569]">{formatCurrency(mun.investimento_planner) || '--'}</td>
                    <td className="p-2.5 text-[#475569]">{mun.prefeito || '--'}</td>
                    <td className="p-2.5 text-[#475569]">{mun.partido || '--'}</td>
                    <td className="p-2.5 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleEditClick(mun)}
                          className="px-2 py-1 border border-gray-200 bg-gray-50 rounded text-[10px] cursor-pointer hover:bg-gray-100" title="Editar">
                          Editar
                        </button>
                        <button onClick={() => {
                          if (window.confirm(`Excluir ${mun.nome} (${mun.ibge}) do D1?`)) {
                            excluirMunicipio(mun.ibge)?.then(r => showFeedback('success', `${mun.nome} excluído do D1.`));
                          }
                        }}
                          className="px-2 py-1 border border-red-200 bg-red-50 rounded text-[10px] cursor-pointer text-red-600 hover:bg-red-100" title="Excluir">
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modais ─── */}
      {editMunicipio && (
        <EditModal
          municipio={editMunicipio}
          editFormData={editFormData}
          setEditFormData={setEditFormData}
          isSaving={isSaving}
          onSave={salvarEdicao}
          onCancel={handleCancelarEdicao}
        />
      )}

      {showNewMunicipio && (
        <NewMunicipioModal
          newMunicipio={newMunicipio}
          setNewMunicipio={setNewMunicipio}
          isSaving={isSaving}
          onCreate={handleNovoMunicipio}
          onCancel={() => setShowNewMunicipio(false)}
        />
      )}
    </div>
  );
}

/* ─── StatusChip (Tailwind-only) ─── */
function StatusChip({ label, value, color }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 min-w-[70px]">
      <div className="text-[9px] text-gray-400 uppercase">{label}</div>
      <div className="text-sm font-bold" style={{ color }}>{value}</div>
    </div>
  );
}