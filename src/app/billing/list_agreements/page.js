"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, query, where, doc, updateDoc } from "firebase/firestore"; 
import { firestore } from '@/lib/firebaseConfig'; 
import Sidebar from '@/components/Sidebar';
import { FaPencilAlt } from 'react-icons/fa'; 
import { Popover } from '@headlessui/react';

export default function ListAgreementsPage() {
    const [selectedStore, setSelectedStore] = useState('both');
    const [agreements, setAgreements] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const fetchAgreements = async (store) => {
        setIsLoading(true);
        try {
            let agreementsData = [];

            const buildQuery = (loja) => {
                let q = collection(firestore, loja, 'agreements', 'acordos');
                if (statusFilter !== 'all') {
                    q = query(q, where('status', '==', statusFilter));
                }
                if (startDate && endDate) {
                    q = query(q, where('data', '>=', new Date(startDate)), where('data', '<=', new Date(endDate)));
                }
                return getDocs(q);
            };

            if (store === 'both') {
                const agreementsLoja1Snapshot = await buildQuery('loja1');
                const agreementsLoja2Snapshot = await buildQuery('loja2');

                const loja1Data = agreementsLoja1Snapshot.docs
                    .map((doc) => ({ id: doc.id, loja: 'Loja 1', ...doc.data() }))
                    .filter((doc) => doc.id !== 'counters');

                const loja2Data = agreementsLoja2Snapshot.docs
                    .map((doc) => ({ id: doc.id, loja: 'Loja 2', ...doc.data() }))
                    .filter((doc) => doc.id !== 'counters');

                agreementsData = [...loja1Data, ...loja2Data];
            } else {
                const agreementsSnapshot = await buildQuery(store);
                agreementsData = agreementsSnapshot.docs
                    .map((doc) => ({ id: doc.id, loja: store === 'loja1' ? 'Loja 1' : 'Loja 2', ...doc.data() }))
                    .filter((doc) => doc.id !== 'counters');
            }

            setAgreements(agreementsData);
        } catch (error) {
            console.error("Erro ao buscar os acordos: ", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedStore) {
            fetchAgreements(selectedStore);
        }
    }, [selectedStore, statusFilter, startDate, endDate]);

    return (
        <div className="flex w-full min-h-screen">
            <div className="hidden lg:block w-16">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col bg-gray-100 min-h-screen">
                <div className="bg-[#932A83] flex-1 flex items-center justify-center p-4 md:p-8">
                    <div className="z-50 bg-white w-full sm:w-[90%] md:w-[90%] lg:w-[60%] flex flex-col p-4 sm:p-8 rounded-3xl shadow-lg border border-gray-300">
                        <h1 className="text-purple-700 text-xl font-bold mb-4">Lista de Acordos</h1>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Selecione a Loja:</label>
                            <select 
                                value={selectedStore} 
                                onChange={(e) => setSelectedStore(e.target.value)} 
                                className="border rounded w-full py-2 px-3 text-gray-700"
                            >
                                <option value="both">Ambas as Lojas</option>
                                <option value="loja1">Loja 1</option>
                                <option value="loja2">Loja 2</option>
                            </select>
                        </div>

                        <div className="mb-6 flex flex-col sm:flex-row gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Data Inicial:</label>
                                <input 
                                    type="date" 
                                    value={startDate} 
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    className="border rounded w-full py-2 px-3 text-gray-700"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Data Final:</label>
                                <input 
                                    type="date" 
                                    value={endDate} 
                                    onChange={(e) => setEndDate(e.target.value)} 
                                    className="border rounded w-full py-2 px-3 text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Status:</label>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)} 
                                className="border rounded w-full py-2 px-3 text-gray-700"
                            >
                                <option value="all">Todos</option>
                                <option value="Em aberto">Em aberto</option>
                                <option value="Judicial">Judicial</option>
                                <option value="Advogado">Advogado</option>
                            </select>
                        </div>

                        {isLoading ? (
                            <p className="text-center text-gray-600">Carregando acordos...</p>
                        ) : (
                            <AgreementList agreements={agreements} fetchAgreements={() => fetchAgreements(selectedStore)} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AgreementList({ agreements, fetchAgreements }) {
    const [editStatus, setEditStatus] = useState({});
    const [savingStatus, setSavingStatus] = useState(false);

    const handleStatusChange = async (agreementId, newStatus, loja) => {
        setSavingStatus(true);
        
        // Determine a loja a partir do nome da loja no documento
        const lojaDoc = loja === "Óticas Popular 1" ? "loja1" : "loja2"; // Altere aqui para usar a propriedade correta
        
        const docRef = doc(firestore, lojaDoc, 'agreements', 'acordos', agreementId);
        
        try {
            // Verifica se o documento existe
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                console.error('Documento não encontrado!', docRef.path);
                return;
            }
    
            // Atualiza o documento
            await updateDoc(docRef, { status: newStatus });
            console.log('Status atualizado com sucesso!');
            fetchAgreements(); // Chama o fetch novamente após atualizar o status
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        } finally {
            setSavingStatus(false);
        }
    };

    return (
        <div className="mb-8">
            {agreements.length > 0 ? (
                <ul className="space-y-4">
                    {agreements.map((agreement, index) => (
                        <li key={`${agreement.id}-${index}`} className="bg-gray-100 p-4 rounded-lg shadow border border-gray-300 relative">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-purple-700">ID #{agreement.id}</span>
                                <p className="mt-1 text-gray-700">
    <strong>Validade: </strong>
    {agreement.data && agreement.data.seconds 
        ? new Date(agreement.data.seconds * 1000).toLocaleDateString('pt-BR') 
        : 'Não disponível'}
</p>

                            </div>
                            <p className="mt-2 text-gray-700"><strong>Pessoa: </strong>{agreement.pessoa}</p>
                            <p className="mt-1 text-gray-700"><strong>Valor: </strong>R$ {agreement.valor}</p>
                            <p className="mt-1 text-gray-700"><strong>Status: </strong>{agreement.status}</p>
                            <p className="mt-1 text-gray-700"><strong>Loja: </strong>{agreement.loja}</p>

                            <Popover className="relative">
                                <Popover.Button className="absolute bottom-4 right-4 text-gray-600 hover:text-gray-900">
                                    <FaPencilAlt size={18} />
                                </Popover.Button>

                                <Popover.Panel className="absolute z-10 p-4 bg-white border rounded shadow-lg text-black">
                                    <p><strong>ID: </strong>{agreement.id}</p>
                                    <p><strong>Pessoa: </strong>{agreement.pessoa}</p>
                                    <p><strong>Valor: </strong>R$ {agreement.valor}</p>
                                    <p><strong>Validade: </strong>{agreement.data && agreement.data.seconds 
                                        ? new Date(agreement.data.seconds * 1000).toLocaleDateString('pt-BR') 
                                        : 'Não disponível'}</p>
                                    <div className="mt-2">
                                        <label>Status: </label>
                                        <select
                                            value={editStatus[agreement.id] || agreement.status}
                                            onChange={(e) =>
                                                setEditStatus({
                                                    ...editStatus,
                                                    [agreement.id]: e.target.value,
                                                })
                                            }
                                            className="border rounded py-1 px-2"
                                        >
                                            <option value="Em aberto">Em aberto</option>
                                            <option value="Advogado">Advogado</option>
                                            <option value="Judicial">Judicial</option>
                                        </select>

                                        <button
                                            className="bg-purple-700 text-white px-2 py-1 rounded mt-2"
                                            onClick={() =>
                                                handleStatusChange(agreement.id, editStatus[agreement.id], agreement.loja)
                                            }
                                            disabled={savingStatus}
                                        >
                                            {savingStatus ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    </div>
                                </Popover.Panel>
                            </Popover>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-600">Nenhum acordo encontrado para essa loja.</p>
            )}
        </div>
    );
}
