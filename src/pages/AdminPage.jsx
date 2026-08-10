import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const AdminPage = () => {
  const { municipios, setMunicipios } = useData(); // Note: we need to add setMunicipios to DataContext
  const [selectedIbge, setSelectedIbge] = useState('');
  const [formData, setFormData] = useState({
    grupo: '',
    obras: '',
    investimento: ''
  });

  const currentMun = municipios.find(m => m.ibge === selectedIbge);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const salvarDados = () => {
    if (!selectedIbge) return alert('Selecione um município');
    
    // Update global state
    const updated = municipios.map(m => 
      m.ibge === selectedIbge 
        ? { ...m, grupo: formData.grupo, total_obras: parseInt(formData.obras), investimento: formData.investimento } 
        : m
    );
    setMunicipios(updated);
    alert('Dados salvos com sucesso! (Simulação em memória)');
  };

  return (
    <div className="page-admin">
      <div className="card">
        <h3>⚙️ Painel Administrativo <small>Editar grupo político e metas</small></h3>
        <div className="form-admin" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Município</label>
            <select 
              id="fMunicipio" 
              style={{ width: '100%', padding: '8px', borderRadius: '7px', border: '1px solid var(--border)' }}
              value={selectedIbge} 
              onChange={e => {
                setSelectedIbge(e.target.value);
                if (currentMun) {
                  setFormData({
                    grupo: currentMun.grupo,
                    obras: currentMun.total_obras || 0,
                    investimento: currentMun.investimento || ''
                  });
                }
              }}
            >
              <option value="">— Selecione —</option>
              {municipios.map(m => <option key={m.ibge} value={m.ibge}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Grupo Político</label>
            <select 
              id="grupo" 
              style={{ width: '100%', padding: '8px', borderRadius: '7px', border: '1px solid var(--border)' }}
              value={formData.grupo} 
              onChange={handleInputChange}
            >
              <option value="">— Selecione —</option>
              <option value="Brandão">Orleans Brandão</option>
              <option value="Braide">Braide</option>
              <option value="neutro">Empate / Neutro</option>
              <option value="indefinido">Indefinido</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Total Obras</label>
            <input 
              id="obras" 
              type="number" 
              style={{ width: '100%', padding: '8px', borderRadius: '7px', border: '1px solid var(--border)' }}
              value={formData.obras} 
              onChange={handleInputChange} 
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '5px' }}>Investimento (R$)</label>
            <input 
              id="investimento" 
              type="text" 
              style={{ width: '100%', padding: '8px', borderRadius: '7px', border: '1px solid var(--border)' }}
              value={formData.investimento} 
              onChange={handleInputChange} 
            />
          </div>
        </div>
        <button className="btn primary" style={{ width: '100%', padding: '12px', fontWeight: '700' }} onClick={salvarDados}>💾 Salvar Alterações</button>
        
        <div className="scroll-table" style={{ marginTop: '30px' }}>
          <table>
            <thead>
              <tr>
                <th>Município</th>
                <th>Grupo</th>
                <th>Obras</th>
                <th>Investimento</th>
              </tr>
            </thead>
            <tbody>
              {municipios.slice(0, 20).map(m => (
                <tr key={m.ibge}>
                  <td>{m.nome}</td>
                  <td>{m.grupo}</td>
                  <td>{m.total_obras || 0}</td>
                  <td>{m.investimento || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>Exibindo primeiras 20 entradas para performance.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
