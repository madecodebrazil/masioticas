import React from 'react';
import { FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

const ConfirmationModalPay = ({ isOpen, onClose, data, onConfirm }) => {
  if (!isOpen) return null;

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    if (typeof value === 'string' && value.includes('R$')) {
      return value;
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value) || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    if (date instanceof Date) {
      return date.toLocaleDateString('pt-BR');
    }
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };
    return lojaNames[lojaId] || lojaId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixo */}
        <div className="flex items-center justify-between p-6 border-b rounded-t-sm bg-[#81059e] border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 ">
            <FiAlertCircle className="text-white text-2xl" />
            <h2 className="text-xl font-bold text-white">
              Confirmar Registro?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-200 hover:text-gray-700 p-1"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content - Com scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
          <p className="text-gray-500 mb-4">
            Revise as informações abaixo antes de confirmar o registro:
          </p>

          {/* Informações do Credor */}
          <div className="bg-gray-50 p-4 rounded-sm">
            <h3 className="font-semibold text-[#81059e] mb-3">Informações do Credor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Nome:</span>
                <p className="text-gray-500">{data.credor || '-'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">CPF/CNPJ:</span>
                <p className="text-gray-500">{data.documentoCredor || '-'}</p>
              </div>
            </div>
          </div>

          {/* Informações do Documento */}
          <div className="bg-gray-50 p-4 rounded-sm">
            <h3 className="font-semibold text-[#81059e] mb-3">Informações do Documento</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Nº Documento:</span>
                <p className="text-gray-500">{data.documento || '-'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Origem:</span>
                <p className="text-gray-500">{data.origem || '-'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Forma de Pagamento:</span>
                <p className="text-gray-500">{data.tipoCobranca || '-'}</p>
              </div>
            </div>
          </div>

          {/* Informações Financeiras */}
          <div className="bg-gray-50 p-4 rounded-sm">
            <h3 className="font-semibold text-[#81059e] mb-3">Informações Financeiras</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Valor:</span>
                <p className="text-gray-500 font-semibold text-lg text-[#81059e]">
                  {formatCurrency(data.valor)}
                </p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Data de Emissão:</span>
                <p className="text-gray-500">{formatDate(data.dataEntrada)}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Data de Vencimento:</span>
                <p className="text-gray-500">{formatDate(data.dataVencimento)}</p>
              </div>
            </div>
          </div>

          {/* Informações Contábeis */}
          <div className="bg-gray-50 p-4 rounded-sm">
            <h3 className="font-semibold text-[#81059e] mb-3">Informações Contábeis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Loja:</span>
                <p className="text-gray-500">{renderLojaName(data.loja)}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Categoria da Despesa:</span>
                <p className="text-gray-500">{data.categoriaDespesa || '-'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Lançamento no Caixa:</span>
                <p className="text-gray-500">{data.lancamentoNoCaixa || '-'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Local de Pagamento:</span>
                <p className="text-gray-500">{data.localPagamento || '-'}</p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {data.observacoes && (
            <div className="bg-gray-50 p-4 rounded-sm">
              <h3 className="font-semibold text-[#81059e] mb-3">Observações</h3>
              <p className="text-gray-500 text-sm">{data.observacoes}</p>
            </div>
          )}
          </div>
        </div>

        {/* Footer - Fixo */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-2 border-2 border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 bg-[#81059e] text-white rounded-sm hover:bg-[#6d0485] font-medium flex items-center gap-2"
          >
            <FiCheck size={18} />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModalPay;