import React from 'react';


const ConfirmationDialog = ({ isOpen, onClose, data, onConfirm }) => {
  if (!data) return null;

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
            <p><span className="font-semibold">Nome do Devedor:</span> {data.cliente}</p>
            <p><span className="font-semibold">CPF/CNPJ:</span> {data.cpf}</p>
            <p><span className="font-semibold">Loja:</span> {data.loja}</p>
            <p><span className="font-semibold">Observações:</span> {data.observacoes}</p>
            <p><span className="font-semibold">Caixa:</span> {data.caixa}</p>
            <p><span className="font-semibold">Data da Entrada:</span> {data.dataEntrada}</p>
            <p><span className="font-semibold">Hora da Entrada:</span> {data.horaEntrada}</p>
            <p><span className="font-semibold">Valor:</span> {data.valorFinal}</p>
            <p><span className="font-semibold">Data de Recebimento:</span> {data.dataRecebimento}</p>
            <p><span className="font-semibold">Hora de Recebimento:</span> {data.horaRecebimento}</p>
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