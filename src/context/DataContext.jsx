import React, { createContext, useState, useContext, useEffect } from 'react';
import { ALL_MUNS, PRIORITARIOS, getStats, carregarMunicipios } from '../data/dados';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [municipios, setMunicipios] = useState([]);
  const [filtroGrupo, setFiltroGrupo] = useState('todos');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initData() {
      setLoading(true);
      const data = await carregarMunicipios();
      const fullData = ALL_MUNS.map(m => {
        const detail = data.find(d => d.ibge === m.ibge);
        return detail ? { ...m, ...detail } : m;
      });
      setMunicipios(fullData);
      setLoading(false);
    }
    initData();
  }, []);

  const filtrados = municipios.filter(m => {
    const matchGrupo = filtroGrupo === 'todos' || m.grupo === filtroGrupo;
    const matchBusca = (m.nome || '').toLowerCase().includes(busca.toLowerCase());
    return matchGrupo && matchBusca;
  });

  const stats = getStats(municipios);

  return (
    <DataContext.Provider value={{ 
      municipios, 
      setMunicipios,
      filtrados, 
      filtroGrupo, 
      setFiltroGrupo, 
      busca, 
      setBusca, 
      stats, 
      loading 
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
