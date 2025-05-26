"use client";

import { useState, useEffect } from 'react';
import { collection, getDocs, getDoc, query, where, doc, updateDoc } from "firebase/firestore";
import { firestore } from '@/lib/firebaseConfig';
import Layout from '@/components/Layout';
import { FaPencilAlt, FaFileInvoice, FaDollarSign, FaClock, FaExclamationTriangle, FaFilter, FaTimes, FaCheck } from 'react-icons/fa';
import { Popover } from '@headlessui/react';
import jsPDF from 'jspdf';

export default function ListAgreementsPage() {
    const [selectedStore, setSelectedStore] = useState('both');
    const [agreements, setAgreements] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAgreement, setSelectedAgreement] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);
    const [sortField, setSortField] = useState('data');
    const [sortDirection, setSortDirection] = useState('asc');
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

            // Aplicar filtro de busca
            if (searchQuery) {
                agreementsData = agreementsData.filter(agreement =>
                    agreement.pessoa?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    agreement.id?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            // Aplicar ordenação
            agreementsData = sortAgreements(agreementsData, sortField, sortDirection);

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
    }, [selectedStore, statusFilter, startDate, endDate, searchQuery, sortField, sortDirection]);

    const sortAgreements = (agreementsToSort, field, direction) => {
        return [...agreementsToSort].sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];

            if (field === 'data') {
                aValue = aValue?.seconds ? new Date(aValue.seconds * 1000) : new Date(0);
                bValue = bValue?.seconds ? new Date(bValue.seconds * 1000) : new Date(0);
            } else if (field === 'valor') {
                aValue = parseFloat(aValue || 0);
                bValue = parseFloat(bValue || 0);
            } else {
                aValue = String(aValue || '').toLowerCase();
                bValue = String(bValue || '').toLowerCase();
            }

            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const handleSort = (field) => {
        const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortField(field);
        setSortDirection(direction);
    };

    const renderSortArrow = (field) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    const openModal = (agreement) => {
        setSelectedAgreement(agreement);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedAgreement(null);
        setIsModalOpen(false);
    };

    const generatePDF = () => {
        if (!selectedAgreement) return;

        const doc = new jsPDF();
        doc.text(`Detalhes do Acordo`, 10, 10);
        doc.text(`ID: ${selectedAgreement.id || 'N/A'}`, 10, 20);
        doc.text(`Pessoa: ${selectedAgreement.pessoa || 'N/A'}`, 10, 30);
        doc.text(`Valor: R$ ${parseFloat(selectedAgreement.valor || 0).toFixed(2)}`, 10, 40);
        doc.text(`Data: ${selectedAgreement.data?.seconds ? new Date(selectedAgreement.data.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}`, 10, 50);
        doc.text(`Status: ${selectedAgreement.status || 'N/A'}`, 10, 60);
        doc.text(`Loja: ${selectedAgreement.loja || 'N/A'}`, 10, 70);

        doc.save(`Acordo_${selectedAgreement.id || 'N/A'}.pdf`);
    };

    // Cálculos para paginação
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentAgreements = agreements.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(agreements.length / itemsPerPage);

    const goToPage = (pageNumber) => {
        setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
    };

    return (
        <Layout>
            <div className="min-h-screen p-0 md:p-2 mb-20">
                <div className="w-full max-w-5xl mx-auto rounded-lg">
                    <div className="mb-4">
                        <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">
                            LISTA DE ACORDOS
                        </h2>
                    </div>

                    {/* Cards de Estatísticas */}
                    <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                            <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <FaFileInvoice className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                                    <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Total de Acordos</span>
                                </div>
                                <p className="text-2xl font-semibold text-center mt-2">{agreements.length}</p>
                            </div>

                            <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <FaDollarSign className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                                    <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Valor Total</span>
                                </div>
                                <p className="text-2xl font-semibold text-center mt-2">
                                    R$ {agreements.reduce((total, agreement) => total + parseFloat(agreement.valor || 0), 0).toFixed(2)}
                                </p>
                            </div>

                            <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <FaClock className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                                    <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Em Aberto</span>
                                </div>
                                <p className="text-2xl font-semibold text-center mt-2">
                                    {agreements.filter(agreement => agreement.status === 'Em aberto').length}
                                </p>
                            </div>

                            <div className="border-2 rounded-lg p-4 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <FaExclamationTriangle className="h-8 w-8 text-[#81059e] bg-purple-300 p-2 rounded-2xl" />
                                    <span className="text-lg font-medium text-gray-700 flex-grow ml-3">Judiciais</span>
                                </div>
                                <p className="text-2xl font-semibold text-center mt-2">
                                    {agreements.filter(agreement => agreement.status === 'Judicial').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Barra de busca e filtros */}
                    <div className="flex flex-wrap gap-2 items-center mb-4">
                        <input
                            type="text"
                            placeholder="Busque por pessoa ou ID"
                            className="p-2 h-10 flex-grow min-w-[200px] border-2 border-gray-200 rounded-lg text-black"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className="p-2 h-10 border-2 border-gray-200 rounded-lg text-gray-800 w-24"
                        >
                            <option value="both">Ambas</option>
                            <option value="loja1">Loja 1</option>
                            <option value="loja2">Loja 2</option>
                        </select>

                        <div className="relative">
                            <button
                                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                                className="p-2 h-10 border-2 border-gray-200 rounded-lg bg-white flex items-center gap-1 text-[#81059e]"
                            >
                                <FaFilter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filtrar</span>
                            </button>

                            {showFilterDropdown && (
                                <div className="absolute z-10 mt-2 w-64 bg-white rounded-lg shadow-lg border p-4">
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Status:</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="w-full p-2 border rounded"
                                            >
                                                <option value="all">Todos</option>
                                                <option value="Em aberto">Em aberto</option>
                                                <option value="Judicial">Judicial</option>
                                                <option value="Advogado">Advogado</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Data Inicial:</label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full p-2 border rounded"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Data Final:</label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full p-2 border rounded"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabela de Acordos */}
                    {isLoading ? (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <table className="min-w-full table-auto select-none">
                                <thead>
                                    <tr className="bg-[#81059e] text-white">
                                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('id')}>
                                            ID {renderSortArrow('id')}
                                        </th>
                                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('pessoa')}>
                                            Pessoa {renderSortArrow('pessoa')}
                                        </th>
                                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('valor')}>
                                            Valor {renderSortArrow('valor')}
                                        </th>
                                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('data')}>
                                            Data {renderSortArrow('data')}
                                        </th>
                                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('status')}>
                                            Status {renderSortArrow('status')}
                                        </th>
                                        <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort('loja')}>
                                            Loja {renderSortArrow('loja')}
                                        </th>
                                        <th className="px-3 py-2">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentAgreements.map((agreement) => (
                                        <tr
                                            key={agreement.id}
                                            className="text-black text-left hover:bg-gray-100 cursor-pointer"
                                            onClick={() => openModal(agreement)}
                                        >
                                            <td className="border px-3 py-2">{agreement.id}</td>
                                            <td className="border px-3 py-2">{agreement.pessoa}</td>
                                            <td className="border px-3 py-2">R$ {parseFloat(agreement.valor || 0).toFixed(2)}</td>
                                            <td className="border px-3 py-2">
                                                {agreement.data?.seconds
                                                    ? new Date(agreement.data.seconds * 1000).toLocaleDateString('pt-BR')
                                                    : 'N/A'}
                                            </td>
                                            <td className="border px-3 py-2">{agreement.status}</td>
                                            <td className="border px-3 py-2">{agreement.loja}</td>
                                            <td className="border px-3 py-2">
                                                <Popover className="relative">
                                                    <Popover.Button className="text-gray-600 hover:text-gray-900">
                                                        <FaPencilAlt size={18} />
                                                    </Popover.Button>

                                                    <Popover.Panel className="absolute z-10 p-4 bg-white border rounded shadow-lg text-black">
                                                        <div className="space-y-2">
                                                            <p><strong>ID: </strong>{agreement.id}</p>
                                                            <p><strong>Pessoa: </strong>{agreement.pessoa}</p>
                                                            <p><strong>Valor: </strong>R$ {agreement.valor}</p>
                                                            <p><strong>Data: </strong>
                                                                {agreement.data?.seconds
                                                                    ? new Date(agreement.data.seconds * 1000).toLocaleDateString('pt-BR')
                                                                    : 'N/A'}
                                                            </p>
                                                            <div className="mt-2">
                                                                <label>Status: </label>
                                                                <select
                                                                    value={agreement.status}
                                                                    onChange={(e) => {
                                                                        const docRef = doc(firestore, agreement.loja === 'Loja 1' ? 'loja1' : 'loja2', 'agreements', 'acordos', agreement.id);
                                                                        updateDoc(docRef, { status: e.target.value });
                                                                        fetchAgreements(selectedStore);
                                                                    }}
                                                                    className="border rounded py-1 px-2"
                                                                >
                                                                    <option value="Em aberto">Em aberto</option>
                                                                    <option value="Advogado">Advogado</option>
                                                                    <option value="Judicial">Judicial</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    </Popover.Panel>
                                                </Popover>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Paginação */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="text-sm text-gray-700">
                                    Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                                    <span className="font-medium">{Math.min(indexOfLastItem, agreements.length)}</span>{' '}
                                    de <span className="font-medium">{agreements.length}</span> registros
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => goToPage(1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded ${currentPage === 1
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#81059e] text-white hover:bg-[#690480]'
                                            }`}
                                    >
                                        &laquo;
                                    </button>
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded ${currentPage === 1
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#81059e] text-white hover:bg-[#690480]'
                                            }`}
                                    >
                                        &lt;
                                    </button>

                                    <span className="px-3 py-1 text-gray-700">
                                        {currentPage} / {totalPages}
                                    </span>

                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded ${currentPage === totalPages
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#81059e] text-white hover:bg-[#690480]'
                                            }`}
                                    >
                                        &gt;
                                    </button>
                                    <button
                                        onClick={() => goToPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded ${currentPage === totalPages
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#81059e] text-white hover:bg-[#690480]'
                                            }`}
                                    >
                                        &raquo;
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal de Detalhes */}
                    {isModalOpen && selectedAgreement && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                            <div className="bg-white rounded-lg shadow-lg w-full max-w-md flex flex-col h-3/5 overflow-hidden">
                                <div className="bg-[#81059e] text-white p-4 flex justify-between items-center">
                                    <h3 className="text-xl font-bold">Detalhes do Acordo</h3>
                                    <FaTimes
                                        className="h-5 w-5 text-white cursor-pointer hover:text-gray-200"
                                        onClick={closeModal}
                                    />
                                </div>
                                <div className="space-y-3 p-4 overflow-y-auto flex-grow">
                                    <p><strong>ID: </strong>{selectedAgreement.id}</p>
                                    <p><strong>Pessoa: </strong>{selectedAgreement.pessoa}</p>
                                    <p><strong>Valor: </strong>R$ {parseFloat(selectedAgreement.valor || 0).toFixed(2)}</p>
                                    <p><strong>Data: </strong>
                                        {selectedAgreement.data?.seconds
                                            ? new Date(selectedAgreement.data.seconds * 1000).toLocaleDateString('pt-BR')
                                            : 'N/A'}
                                    </p>
                                    <p><strong>Status: </strong>{selectedAgreement.status}</p>
                                    <p><strong>Loja: </strong>{selectedAgreement.loja}</p>
                                </div>
                                <div className="p-4 bg-gray-50 border-t flex justify-around">
                                    <button
                                        onClick={generatePDF}
                                        className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                                    >
                                        <FaFileInvoice className="mr-2" />
                                        Ver PDF
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="bg-[#81059e] text-white px-4 py-2 rounded-md flex items-center"
                                    >
                                        <FaFileInvoice className="mr-2" />
                                        Imprimir
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
