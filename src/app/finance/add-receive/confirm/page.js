"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { firestore } from '../../../../lib/firebaseConfig'; 
import { doc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore'; 
import { useSearchParams } from 'next/navigation'; // Para capturar os parâmetros da URL
import { useRouter } from 'next/navigation'; // Para redirecionamento

export function ConfirmReceber() {
  const [conta, setConta] = useState({}); // Estado para armazenar os dados da conta
  const searchParams = useSearchParams(); // Hook para acessar os parâmetros da URL
  const router = useRouter(); // Hook para redirecionamento

  useEffect(() => {
    // Pega os dados da URL e atribui aos estados
    const cliente = searchParams.get('cliente');
    const cpf = searchParams.get('cpf');
    const loja = searchParams.get('loja');
    const observacoes = searchParams.get('observacoes');
    const caixa = searchParams.get('caixa');
    const data = searchParams.get('data'); // Agora é 'data'
    const horaEntrada = searchParams.get('horaEntrada');
    const valorFinal = searchParams.get('valorFinal');
    const dataRecebimento = searchParams.get('dataRecebimento');
    const horaRecebimento = searchParams.get('horaRecebimento');

    const contaData = {
      cliente,
      cpf,
      loja,
      observacoes,
      caixa,
      data, // Usando 'data'
      horaEntrada,
      valorFinal: parseFloat(valorFinal),
      dataRecebimento,
      horaRecebimento,
    };

    setConta(contaData); // Armazena os dados no estado
  }, [searchParams]);

  // Função para confirmar e enviar os dados para o Firestore
  const handleConfirm = async () => {
    try {
      const timestampRecebimento = Timestamp.fromDate(new Date(`${conta.dataRecebimento} ${conta.horaRecebimento}`));

      // Enviar os dados para a coleção "crediarios"
      await addDoc(collection(firestore, "crediarios"), {
        cliente: conta.cliente,
        cpf: conta.cpf,
        loja: conta.loja,
        observacoes: conta.observacoes,
        caixa: conta.caixa,
        data: conta.data, // Usando 'data'
        horaEntrada: conta.horaEntrada,
        valorFinal: conta.valorFinal,
        dataRecebimento: timestampRecebimento, // Timestamp de data e hora
      });

      alert("Conta registrada com sucesso!");
      router.push("/finance/add-receive/list-receives"); // Redireciona para a lista de crediários
    } catch (error) {
      console.error("Erro ao registrar a conta: ", error);
      alert("Erro ao registrar a conta. Tente novamente.");
    }
  };

  return (
    <Layout>
      <div className="flex h-full p-8 justify-center items-center flex-col">
        <div className="flex-1 w-full max-w-4xl">
          <h2 className="text-2xl font-semibold text-[#932A83] mb-6">CONFIRMAÇÃO DOS DADOS</h2>

          <div className="text-black bg-white p-6 rounded-lg shadow-md space-y-4">
            <div>
              <p><strong>Nome do Devedor:</strong> {conta.cliente}</p>
              <p><strong>CPF/CNPJ:</strong> {conta.cpf}</p>
              <p><strong>Loja:</strong> {conta.loja}</p>
              <p><strong>Observações:</strong> {conta.observacoes}</p>
              <p><strong>Caixa:</strong> {conta.caixa}</p>
              <p><strong>Data:</strong> {conta.data}</p> {/* Usando 'data' */}
              <p><strong>Hora da Entrada:</strong> {conta.horaEntrada}</p>
              <p><strong>Valor:</strong> R$ {conta.valorFinal}</p>
              <p><strong>Data de Recebimento:</strong> {conta.dataRecebimento}</p>
              <p><strong>Hora de Recebimento:</strong> {conta.horaRecebimento}</p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => router.back()}
                className="bg-gray-300 text-black py-2 px-4 rounded-md"
              >
                Editar
              </button>
              <button
                onClick={handleConfirm}
                className="bg-[#932A83] text-white py-2 px-4 rounded-md"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConfirmReceber />
    </Suspense>
  );
}