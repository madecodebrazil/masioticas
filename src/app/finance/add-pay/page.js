"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { collection, getDocs, addDoc, Timestamp, doc, setDoc } from 'firebase/firestore';
import { firestore } from '../../../lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import Link from 'next/link';
import ConfirmationModal from '../../../components/ConfirmationModal';

export default function ContasPagar() {
  const { userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState(null);

  // Definir loja inicial baseado nas permissões
  useEffect(() => {
    if (userPermissions) {
      // Se não for admin, usa a primeira loja que tem acesso
      if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
      // Se for admin, usa a primeira loja da lista
      else if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
        setSelectedLoja(userPermissions.lojas[0]);
      }
    }
  }, [userPermissions]);

  const [formData, setFormData] = useState({
    credor: '',
    cpfCredor: '',
    documento: '',
    parcela: '',
    tipoCobranca: '',
    origem: '',
    valor: '',
    taxaJuros: '',
    dataEntrada: '',
    horaEntrada: '',
    dataVencimento: '',
    horaVencimento: '',
    localCobranca: '',
    contaLancamentoCaixa: '',
    dispensarJuros: false,
    observacoes: ''
  });

  const [credores, setCredores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCredores = async () => {
    if (!searchTerm.trim() || !selectedLoja) return setCredores([]);
    try {
      // Busca credores da loja selecionada
      const querySnapshot = await getDocs(collection(firestore, `lojas/${selectedLoja}/clientes`));
      const filtered = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(credor => 
          credor.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          credor.cpf?.includes(searchTerm)
        );
      setCredores(filtered);
    } catch (error) {
      console.error("Erro ao buscar credores:", error);
    }
  };

  useEffect(() => {
    fetchCredores();
  }, [searchTerm, selectedLoja]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleValorChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, valor: (Number(valor) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }));
  };

  const handleCredorSelect = (credor) => {
    setFormData(prev => ({ ...prev, credor: credor.nome, cpfCredor: credor.cpf }));
    setSearchTerm('');
    setCredores([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleClear = () => {
    setFormData({
      credor: '', cpfCredor: '', loja: 'Óticas Popular 1', documento: '', parcela: '', tipoCobranca: '',
      origem: '', valor: '', taxaJuros: '', dataEntrada: '', horaEntrada: '', dataVencimento: '',
      horaVencimento: '', localCobranca: '', contaLancamentoCaixa: '', dispensarJuros: false, observacoes: ''
    });
    setSearchTerm('');
    setCredores([]);
  };

  const handleConfirm = async () => {
    if (!selectedLoja) {
      alert("Selecione uma loja primeiro!");
      return;
    }

    try {
      const timestampEntrada = Timestamp.fromDate(new Date());
      const timestampVencimento = formData.dataVencimento;

      const contaData = {
        ...formData,
        loja: selectedLoja,
        registradoPor: userData?.nome || 'Sistema',
        dataEntrada: timestampEntrada,
        dataVencimento: timestampVencimento,
        status: 'pendente',
        createdAt: Timestamp.now()
      };

      // Salva na subcoleção da loja correta
      await addDoc(
        collection(firestore, `lojas/${selectedLoja}/financeiro/contas_pagar`), 
        contaData
      );

      alert("Conta a pagar registrada com sucesso!");
      handleClear();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao registrar conta a pagar:", error);
      alert("Erro ao registrar a conta. Tente novamente.");
    }
  };

  return (
    <Layout>
      <div className="min-h-screen p-2">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8">ADICIONAR CONTAS A PAGAR</h2>
          
          {/* Seletor de Loja para Admins */}
          {userPermissions?.isAdmin && (
            <div className="mb-6">
              <label className="text-[#81059e] font-medium">Selecionar Loja</label>
              <select
                value={selectedLoja || ''}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black ml-2"
              >
                <option value="">Selecione uma loja</option>
                {userPermissions.lojas.map((loja) => (
                  <option key={loja} value={loja}>
                    {loja === 'loja1' ? 'Loja 1' : 'Loja 2'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className='space-x-2'>
            <Link href={`/finance/${selectedLoja}/add-pay/list-bills`}>
              <button className="bg-[#81059e] p-3 rounded-sm text-white">
                PAGAMENTOS PENDENTES
              </button>
            </Link>
            <button
              onClick={handleClear}
              className="text-[#81059e] px-4 py-2 border-2 border-[#81059e] font-bold text-base rounded-sm"
            >
              Limpar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 mb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[#81059e] font-medium">Nome do Credor</label>
                <input
                  type="text"
                  value={formData.credor}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Digite o nome do credor"
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  required
                />
                {searchTerm && credores.length > 0 && (
                  <ul className="absolute bg-white border-2 border-[#81059e] rounded-lg mt-1 max-h-60 overflow-auto z-10">
                    {credores.map((credor) => (
                      <li
                        key={credor.id}
                        onClick={() => handleCredorSelect(credor)}
                        className="p-2 hover:bg-purple-50 cursor-pointer text-black border-b last:border-b-0"
                      >
                        {credor.nome} (CPF: {credor.cpf})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="text-[#81059e] font-medium">CPF do Credor</label>
                <input
                  type="text"
                  value={formData.cpfCredor}
                  readOnly
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full bg-gray-100 text-black"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="text-[#81059e] font-medium">Nº do Documento</label>
                <input
                  type="text"
                  name="documento"
                  value={formData.documento}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
              <div>
                <label className="text-[#81059e] font-medium">Parcela</label>
                <input
                  type="text"
                  name="parcela"
                  value={formData.parcela}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
              <div>
                <label className="text-[#81059e] font-medium">Tipo de Cobrança</label>
                <select
                  name="tipoCobranca"
                  value={formData.tipoCobranca}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                >
                  <option value="">Selecione</option>
                  <option value="boleto">Boleto</option>
                  <option value="cartao">Cartão</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">PIX</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div>
                <label className="text-[#81059e] font-medium">Valor</label>
                <input
                  type="text"
                  name="valor"
                  value={formData.valor}
                  onChange={handleValorChange}
                  placeholder="R$ 0,00"
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  required
                />
              </div>
              <div>
                <label className="text-[#81059e] font-medium">Taxa de Juros (%)</label>
                <input
                  type="number"
                  name="taxaJuros"
                  value={formData.taxaJuros}
                  onChange={handleInputChange}
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                />
              </div>
              <div>
                <label className="text-[#81059e] font-medium">Data de Vencimento</label>
                <DatePicker
                  selected={formData.dataVencimento}
                  onChange={(date) => setFormData(prev => ({ ...prev, dataVencimento: date }))}
                  dateFormat="dd/MM/yyyy"
                  className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                  placeholderText="Selecione a data"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="text-[#81059e] font-medium">Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleInputChange}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black min-h-[120px]"
                placeholder="Adicione observações relevantes..."
              ></textarea>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button type="submit" className="bg-[#81059e] p-3 rounded-sm text-white">REGISTRAR</button>
              <button type="button" onClick={() => setFormData({})} className="border-2 border-[#81059e] p-3 rounded-sm text-[#81059e]">CANCELAR</button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={{...formData, loja: selectedLoja}}
        onConfirm={handleConfirm}
      />
    </Layout>
  );
}
