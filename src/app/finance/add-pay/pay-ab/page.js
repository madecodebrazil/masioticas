"use client";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout'; 
import { firestore } from '../../../../lib/firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore'; 

export default function TipoContasPagarAB() {
    const [isLoading, setIsLoading] = useState(false); // Control loading state
    const [contas, setContas] = useState([]); // State to hold the accounts data

    // Function to fetch 'tipo_contas_pagar' data
    const fetchContas = async () => {
        setIsLoading(true);
        try {
            const snapshot = await getDocs(collection(firestore, 'tipo_contas_pagar'));
            const contasList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setContas(contasList);
        } catch (error) {
            console.error('Erro ao buscar dados de tipo_contas_pagar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle adding a new 'conta'
    const handleAddConta = async () => {
        const newContaName = prompt('Digite o nome da nova conta a pagar');
        if (newContaName) {
            setIsLoading(true);
            try {
                await addDoc(collection(firestore, 'tipo_contas_pagar'), { name: newContaName });
                await fetchContas(); // Refresh the list after adding
            } catch (error) {
                console.error('Erro ao adicionar nova conta:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchContas();
    }, []);

    return (
        <Layout>
            <div className="p-6">
                <h1 className="text-3xl font-bold text-center text-[#800080] mb-6">Gerenciar Tipos de Contas a Pagar</h1>

                {contas.length > 0 ? (
                    <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {contas.map((conta) => (
                            <li key={conta.id} className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow">
                                {conta.name}
                            </li>
                        ))}
                        <li
                            className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
                            onClick={handleAddConta}
                        >
                            <span className="text-2xl font-bold">+</span>
                        </li>
                    </ul>
                ) : (
                    <div>
                        <p className="text-gray-500">Nenhuma conta cadastrada ainda.</p>
                        {/* '+' Button to add a new conta when none exist */}
                        <button
                            className="mt-4 bg-[#800080] text-white py-2 px-4 rounded-lg shadow hover:bg-[#660066] transition"
                            onClick={handleAddConta}
                        >
                            Adicionar Nova Conta
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
