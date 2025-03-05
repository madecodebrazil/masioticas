import React from 'react';

const ConfirmationDialog = ({ isOpen, onClose, data, onConfirm }) => {
  if (!data) return null;

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#81059e]">
            CONFIRMAÇÃO DOS DADOS
          </DialogTitle>
        </DialogHeader>

        <div className="text-black space-y-3 mt-4">
          <div className="grid gap-2">
            <p><span className="font-semibold">Cliente:</span> {data.cliente || "N/A"}</p>
            <p><span className="font-semibold">CPF:</span> {data.cpf || "N/A"}</p>
            <p><span className="font-semibold">Loja:</span> {data.loja || "N/A"}</p>
            <p><span className="font-semibold">Nº Documento:</span> {data.numeroDocumento || "N/A"}</p>
            <p><span className="font-semibold">Tipo de Cobrança:</span> {data.tipoCobranca || "N/A"}</p>
            <p><span className="font-semibold">Origem:</span> {data.origem || "N/A"}</p>
            <p><span className="font-semibold">Valor:</span> {formatarValor(data.valor)}</p>
            <p><span className="font-semibold">Taxa de Juros:</span> {data.taxaJuros ? `${data.taxaJuros}%` : "0%"}</p>
            <p><span className="font-semibold">Data de Cobrança:</span> {formatarData(data.dataCobranca)}</p>
            <p><span className="font-semibold">Local de Cobrança:</span> {data.localCobranca || "N/A"}</p>
            <p><span className="font-semibold">Conta para Lançamento:</span> {data.contaLancamentoCaixa || "N/A"}</p>
            <p><span className="font-semibold">Dispensar Juros:</span> {data.dispensarJuros ? "Sim" : "Não"}</p>
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
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationDialog;