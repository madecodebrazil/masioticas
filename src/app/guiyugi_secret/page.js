// pages/AddCollaborator.js
"use client"
import { useState } from 'react';
import { firestore } from  '../../lib/firebaseConfig'; // Importar a configuração do Firestore
import { collection, addDoc } from 'firebase/firestore';

const AddCollaborator = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Adiciona um novo colaborador na coleção 'colaboradores'
      const docRef = await addDoc(collection(firestore, 'colaboradores'), {
        name,
      });
      console.log('Colaborador adicionado com ID: ', docRef.id);
      setName(''); // Limpar o campo de entrada
    } catch (e) {
      console.error('Erro ao adicionar colaborador: ', e);
      setError('Erro ao adicionar colaborador. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white p-6 rounded shadow-md w-1/3"
      >
        <h2 className="text-lg font-bold mb-4">Adicionar Colaborador</h2>
        {error && <p className="text-red-500">{error}</p>}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do Colaborador"
          className="border border-gray-300 p-2 rounded w-full mb-4"
          required
        />
        <button 
          type="submit" 
          className={`bg-blue-500 text-white p-2 rounded w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Adicionando...' : 'Adicionar'}
        </button>
      </form>
    </div>
  );
};

export default AddCollaborator;
