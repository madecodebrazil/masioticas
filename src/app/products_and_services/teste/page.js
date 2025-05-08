'use client';

import { useState } from 'react';
// import OSForm from '@/components/OSForm';

export default function TestOSFormPage() {
  // Dados iniciais para o formulário
  const initialData = {
    tipoOS: "completa",
    laboratorio: "",
    status: "processamentoInicial",
    armacaoDados: "",
    lenteDados: "",
    esferaDireito: "",
    cilindroDireito: "",
    eixoDireito: "",
    adicaoDireito: "",
    esferaEsquerdo: "",
    cilindroEsquerdo: "",
    eixoEsquerdo: "",
    adicaoEsquerdo: "",
    distanciaInterpupilar: "",
    altura: "",
    observacoes: "",
    dataPrevistaEntrega: ""
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = (formData) => {
    console.log("Formulário enviado:", formData);
    alert("Formulário enviado com sucesso!");
  };

  // Função para lidar com o cancelamento
  const handleCancel = () => {
    console.log("Operação cancelada");
    alert("Operação cancelada pelo usuário");
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Teste do Componente OSForm</h1>
      <div className="bg-white shadow-md rounded p-6">
        <OSForm 
          data={initialData} 
          onSubmit={handleSubmit} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  );
}