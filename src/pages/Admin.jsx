import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { formatCurrency, CORES, LABELS, MUNICIPIOS } from '../data/municipios';
import { Save, RotateCcw, Search, Filter } from 'lucide-react';

export function AdminPage() {
  const { 
    municipios, 
    setMunicipioId,
    geoJSONData,
    initTema
  } = useStore();
  
  const [fMunicipio, setFMunicipio] = useState('');
  const [fGrupo, setFGrupo] = useState('Brandão');
  const [fObras, setFObras] = useState('');
  const [fInvest, setFInvest] = useState('');
  const [editando, setEditando] = useState(null);
  
  useEffect(() => {
    initTema();
    
    if (!geoJSONData) {
      fetch('/ma_municipios.min.geojson')
        .then(r => r.json())
        .then(data => useStore.getState().setGeoJSONData(data))
        .catch(console.error);
    }
  }, [geoJSONData, initTema]);
  
  const salvarAdmin = () => {
    if (!fMunicipio) return alert('Selecione um município');
    
    const idx = MUNICIPIOS.findIndex(m => m.ibge === fMunicipio);
    if (idx >= 0) {
      MUNICIPIOS[idx] = {
        ...MUNICIPIOS[idx],
        grupo: fGrupo,
        total_obras: parseInt(fObras) || 0,
        investimento_planner: fInvest || '—'
      };
      // Force re-render
      useStore.setState({ municipios: [...MUNICIPIOS] });
      alert('Salvo com sucesso!');
    }
  };
  
  const resetDados = () => {
    if (confirm('Restaurar dados originais?')) {
      location.reload();
    }
  };
  
  const handleEditar = (municipio) => {
    setEditando(municipio);
    setFMunicipio(municipio.ibge);
    setFGrupo(municipio.grupo);
    setFObras(municipio.total_obras || 0);
    setFInvest(municipio.investimento_planner || '');
  };
  
  const grupos = [
    { value: 'Brandão', label: 'Orleans Brandão' },
    { value: 'Braide', label: 'Braide' },
    { value: 'neutro', label: 'Empate / Neutro' },
    { value: 'indefinido', label: 'Indefinido' }
  ];
  
  return (
    <div style={{ padding: '24px' }}>
      <div style={{ background: '#fff', border: '1px solid #dde3ea', borderRadius: '10px', padding: '16px 18px' }}>
        <h3 style={{ 
          fontSize: '14px', color: '#0b3c5d', marginBottom: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          ⚙️ Painel Administrativo <small style={{ fontSize: '11px', color: '#7a8a99', fontWeight: 400 }}>editar grupo político e dados</small>
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px', marginBottom: '14px' }}>
          <select 
            value={fMunicipio}
            onChange={(e) => setFMunicipio(e.target.value)}
            style={{ padding: '9px 10px', border: '1px solid #dde3ea', borderRadius: '7px', fontSize: '13px', background: '#fff', color: '#22313f' }}
          >
            <option value="">— Selecione um município —</option>
            {MUNICIPIOS.map(m => (
              <option key={m.ibge} value={m.ibge}>{m.nome}</option>
            ))}
          </select>
          
          <select 
            value={fGrupo}
            onChange={(e) => setFGrupo(e.target.value)}
            style={{ padding: '9px 10px', border: '1px solid #dde3ea', borderRadius: '7px', fontSize: '13px', background: '#fff', color: '#22313f' }}
          >
            {grupos.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          
          <input 
            type="number" 
            value={fObras}
            onChange={(e) => setFObras(e.target.value)}
            placeholder="Total obras"
            min="0"
            style={{ padding: '9px 10px', border: '1px solid #dde3ea', borderRadius: '7px', fontSize: '13px', background: '#fff', color: '#22313f' }}
          />
          
          <input 
            type="text" 
            value={fInvest}
            onChange={(e) => setFInvest(e.target.value)}
            placeholder="Investimento (R$)"
            style={{ padding: '9px 10px', border: '1px solid #dde3ea', borderRadius: '7px', fontSize: '13px', background: '#fff', color: '#22313f' }}
          />
          
          <button onClick={salvarAdmin} style={{ 
            padding: '9px 14px', border: 'none', background: '#0b3c5d', color: '#fff', 
            borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            <Save size={16} /> Salvar
          </button>
          
          <button onClick={resetDados} style={{ 
            padding: '9px 14px', border: '1px solid rgba(192,57,43,0.3)', background: '#fff', color: '#c0392b', 
            borderRadius: '7px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}>
            <RotateCcw size={16} /> Restaurar
          </button>
        </div>
        
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f4f6f8', color: '#7a8a99', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Município</th>
                <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Grupo</th>
                <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Obras</th>
                <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Investimento</th>
                <th style={{ textAlign: 'left', padding: '9px 10px', borderBottom: '2px solid #dde3ea' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {MUNICIPIOS.map(m => (
                <tr key={m.ibge} style={{ borderBottom: '1px solid #dde3ea' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ 
                      width: '10px', height: '10px', borderRadius: '50%', 
                      background: CORES[m.grupo] || '#555',
                      display: 'inline-block', marginRight: '6px', verticalAlign: 'middle'
                    }}></span>
                    {m.nome} {m.isPriority && '⭐'}
                  </td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
                      fontWeight: 700, color: '#fff', background: CORES[m.grupo] || '#555',
                      display: 'inline-block'
                    }}>
                      {LABELS[m.grupo] || m.grupo}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>{m.total_obras || 0}</td>
                  <td style={{ padding: '8px 10px' }}>{formatCurrency(m.investimento_planner)}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <button 
                      onClick={() => handleEditar(m)}
                      style={{ 
                        padding: '5px 10px', border: '1px solid #dde3ea', background: '#fff', 
                        borderRadius: '7px', fontSize: '11px', cursor: 'pointer',
                        color: '#0b3c5d', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}