// hooks/useCaixas.js
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';

export const useCaixas = (selectedLoja) => {
  const [caixas, setCaixas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCaixas = async () => {
    if (!selectedLoja) {
      setCaixas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const caixasQuery = query(
        collection(firestore, `lojas/${selectedLoja}/financeiro/controle_caixa/caixas`),
        where('ativo', '==', true)
      );
      
      const snapshot = await getDocs(caixasQuery);
      
      const caixasData = [];
      snapshot.forEach((doc) => {
        caixasData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setCaixas(caixasData);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar caixas:", err);
      setError("Não foi possível carregar os caixas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaixas();
  }, [selectedLoja]);

  return {
    caixas,
    loading,
    error,
    refreshCaixas: fetchCaixas
  };
};