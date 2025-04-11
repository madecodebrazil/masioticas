"use client";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { firestore } from '../../../lib/firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';

export default function ConveniosPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [convenios, setConvenios] = useState([]);

    // Função para buscar os convênios no Firestore
    const fetchConvenios = async () => {
        setIsLoading(true);
        try {
            const snapshot = await getDocs(collection(firestore, 'convenios'));
            const conveniosList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setConvenios(conveniosList);
        } catch (error) {
            console.error('Erro ao buscar dados de convenios: ', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Função para adicionar um novo convênio
    const handleAddConvenio = async () => {
        const newConvenio = prompt('Digite o nome do novo convênio');
        if (!newConvenio) return;

        setIsLoading(true);
        try {
            await addDoc(collection(firestore, 'convenios'), { name: newConvenio });
            fetchConvenios();
        } catch (error) {
            console.error('Erro ao adicionar convênio: ', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Carrega os convênios ao montar o componente
    useEffect(() => {
        fetchConvenios();
    }, []);

    return (
        <Layout>
            <div className="p-6">
                <h1 className="text-3xl font-bold text-center text-[#800080] mb-6">Gerenciar Convênios</h1>

                <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-[#800080] mb-4">Convênios</h2>
                    {isLoading ? (
                        <p className="text-center text-gray-500"> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></p>
                    ) : (
                        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {convenios.map((convenio) => (
                                <li key={convenio.id} className="bg-white text-black border-2 border-[#800080] p-4 rounded-lg shadow">
                                    {convenio.name}
                                </li>
                            ))}
                            <li
                                className="bg-[#800080] text-white border-2 border-[#800080] p-4 rounded-lg shadow cursor-pointer flex justify-center items-center hover:bg-[#660066] transition"
                                onClick={handleAddConvenio}
                            >
                                <span className="text-2xl font-bold">+</span>
                            </li>
                        </ul>
                    )}
                </div>
            </div>
        </Layout>
    );
}
