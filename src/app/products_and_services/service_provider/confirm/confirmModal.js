import React from 'react';
import { FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

const ConfirmationModalProvider = ({ isOpen, onClose, data, onConfirm }) => {
  if (!isOpen) return null;

  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    const numericCPF = cpf.replace(/\D/g, '');
    if (numericCPF.length === 11) {
      return numericCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return cpf;
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const numericPhone = phone.replace(/\D/g, '');
    if (numericPhone.length === 11) {
      return numericPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const formatCEP = (cep) => {
    if (!cep) return '-';
    const numericCEP = cep.replace(/\D/g, '');
    if (numericCEP.length === 8) {
      return numericCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cep;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-sm max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixo */}
        <div className="flex items-center justify-between p-6 border-b rounded-t-sm bg-[#81059e] border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-white text-2xl" />
            <h2 className="text-xl font-bold text-white">
              Confirmar Cadastro de Prestador?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-200 hover:text-white p-1 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content - Com scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <p className="text-gray-500 mb-4">
              Revise as informações abaixo antes de confirmar o cadastro do prestador:
            </p>

            {/* Informações Pessoais */}
            <div className="bg-gray-50 p-4 rounded-sm">
              <h3 className="font-semibold text-[#81059e] mb-3">Informações Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Nome Completo:</span>
                  <p className="text-gray-500">{data.name || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Apelido:</span>
                  <p className="text-gray-500">{data.apelido || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">CPF:</span>
                  <p className="text-gray-500 font-mono">{formatCPF(data.cpf)}</p>
                </div>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="bg-gray-50 p-4 rounded-sm">
              <h3 className="font-semibold text-[#81059e] mb-3">Informações de Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">E-mail:</span>
                  <p className="text-gray-500">{data.email || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Telefone:</span>
                  <p className="text-gray-500 font-mono">{formatPhone(data.telefone)}</p>
                </div>
              </div>
            </div>

            {/* Informações de Endereço */}
            <div className="bg-gray-50 p-4 rounded-sm">
              <h3 className="font-semibold text-[#81059e] mb-3">Endereço</h3>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-semibold text-gray-700">CEP:</span>
                    <p className="text-gray-500 font-mono">{formatCEP(data.cep)}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-700">Logradouro:</span>
                    <p className="text-gray-500">{data.logradouro || '-'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="font-semibold text-gray-700">Número:</span>
                    <p className="text-gray-500">{data.numero || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Complemento:</span>
                    <p className="text-gray-500">{data.complemento || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Bairro:</span>
                    <p className="text-gray-500">{data.bairro || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold text-gray-700">Cidade:</span>
                    <p className="text-gray-500">{data.cidade || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Estado:</span>
                    <p className="text-gray-500">{data.estado || '-'}</p>
                  </div>
                </div>

                {/* Endereço Completo Formatado */}
                <div className="pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">Endereço Completo:</span>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {[
                      data.logradouro,
                      data.numero && `nº ${data.numero}`,
                      data.complemento,
                      data.bairro,
                      data.cidade,
                      data.estado,
                      formatCEP(data.cep)
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="bg-green-50 p-4 rounded-sm border border-green-200">
              <h3 className="font-semibold text-green-700 mb-2">Status</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 text-sm font-medium">Ativo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixo */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-[#81059e] text-white rounded-sm hover:bg-[#6d0485] font-medium flex items-center gap-2 transition-colors"
          >
            <FiCheck size={18} />
            Confirmar Cadastro
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModalProvider;