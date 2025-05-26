import React from 'react';

const ConfirmationModal = ({ isOpen, onClose, data, onConfirm }) => {
  if (!isOpen || !data) return null;

  // Formata o valor para exibição
  const formatarValor = (valor) => {
    if (typeof valor === 'string' && valor) {
      return valor;
    } else if (typeof valor === 'number') {
      return valor.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL' 
      });
    }
    return "N/A";
  };

  // Formata a data para exibição
  const formatarData = (data) => {
    if (!data) return "N/A";
    if (data instanceof Date) {
      return data.toLocaleDateString('pt-BR');
    }
    return "N/A";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-[500px] w-full mx-4 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-[#81059e]">
            TEM CERTEZA QUE DESEJA REGISTRAR?
          </h2>
        </div>

        <div className="text-black space-y-3 mt-4">
          <div className="grid gap-2">
            <p><span className="font-semibold">Credor:</span> {data.credor || "N/A"}</p>
            <p><span className="font-semibold">CPF/CNPJ:</span> {data.documentoCredor || "N/A"}</p>
            <p><span className="font-semibold">Forma de Pagamento:</span> {data.tipoCobranca || "N/A"}</p>
            <p><span className="font-semibold">Origem:</span> {data.origem || "N/A"}</p>
            <p><span className="font-semibold">Valor:</span> {formatarValor(data.valor)}</p>
            <p><span className="font-semibold">Parcelas:</span> {data.totalParcelas}</p>
            <p><span className="font-semibold">Data de Emissão:</span> {formatarData(data.dataEntrada)}</p>
            <p><span className="font-semibold">Data de Vencimento:</span> {formatarData(data.dataVencimento)}</p>
            <p><span className="font-semibold">Local de Pagamento:</span> {data.localPagamento || "N/A"}</p>
            <p><span className="font-semibold">Categoria da Despesa:</span> {data.categoriaDespesa || "N/A"}</p>
            <p><span className="font-semibold">Conta Bancária:</span> {data.contaBancaria || "N/A"}</p>
            <p><span className="font-semibold">Lançamento no Caixa:</span> {data.lancamentoNoCaixa || "N/A"}</p>
            {data.observacoes && <p><span className="font-semibold">Observações:</span> {data.observacoes}</p>}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={onConfirm}
            className="bg-[#81059e] text-white px-4 py-2 rounded-md hover:bg-[#7d2370] transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;