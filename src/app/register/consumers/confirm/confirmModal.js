import React from 'react';
import { FiX, FiCheck, FiAlertCircle, FiUser, FiMail, FiPhone } from 'react-icons/fi';

const ConfirmationModalClient = ({ isOpen, onClose, data, onConfirm, isTitular, selectedTitular }) => {
  if (!isOpen) return null;

  const formatCPF = (cpf) => {
    if (!cpf) return '-';
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  const formatCEP = (cep) => {
    if (!cep) return '-';
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const formatDate = (date) => {
    if (!date) return '-';
    if (date instanceof Date) {
      return date.toLocaleDateString('pt-BR');
    }
    // Se a data está no formato yyyy-mm-dd, converter para dd/mm/yyyy
    if (typeof date === 'string' && date.includes('-')) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    }
    return date;
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
      <div className="bg-white rounded-sm max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixo */}
        <div className="flex items-center justify-between p-6 border-b rounded-t-sm bg-[#81059e] border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <FiAlertCircle className="text-white text-2xl" />
            <h2 className="text-xl font-bold text-white">
              Confirmar Cadastro de Cliente?
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-200 hover:text-white p-1"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content - Com scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <p className="text-gray-500 mb-4">
              Revise as informações abaixo antes de confirmar o cadastro do cliente:
            </p>

            {/* Informações Pessoais */}
            <div className="bg-gray-50 p-4 rounded-sm">
              <h3 className="font-semibold text-[#81059e] mb-3 flex items-center gap-2">
                <FiUser size={18} />
                Informações Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Nome Completo:</span>
                  <p className="text-gray-600 font-medium">{data.nome || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">CPF:</span>
                  <p className="text-gray-600">{formatCPF(data.cpf)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Data de Nascimento:</span>
                  <p className="text-gray-600">{formatDate(data.dataNascimento)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Gênero:</span>
                  <p className="text-gray-600">{data.genero || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Estado Civil:</span>
                  <p className="text-gray-600">{data.estadoCivil || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Escolaridade:</span>
                  <p className="text-gray-600">{data.escolaridade || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Profissão:</span>
                  <p className="text-gray-600">{data.profissao || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Instagram:</span>
                  <p className="text-gray-600">{data.instagram ? `@${data.instagram}` : '-'}</p>
                </div>
              </div>
            </div>

            {/* Informações de Contato */}
            <div className="bg-gray-50 p-4 rounded-sm">
              <h3 className="font-semibold text-[#81059e] mb-3 flex items-center gap-2">
                <FiPhone size={18} />
                Informações de Contato
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Telefone:</span>
                  <p className="text-gray-600">{formatPhone(data.telefone)}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <p className="text-gray-600 flex items-center gap-1">
                    {data.email ? (
                      <>
                        <FiMail size={14} />
                        {data.email}
                      </>
                    ) : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="bg-gray-50 p-4 rounded-sm">
              <h3 className="font-semibold text-[#81059e] mb-3">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">CEP:</span>
                  <p className="text-gray-600">{formatCEP(data.endereco?.cep)}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="font-semibold text-gray-700">Logradouro:</span>
                  <p className="text-gray-600">{data.endereco?.logradouro || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Número:</span>
                  <p className="text-gray-600">{data.endereco?.numero || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Complemento:</span>
                  <p className="text-gray-600">{data.endereco?.complemento || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Bairro:</span>
                  <p className="text-gray-600">{data.endereco?.bairro || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Cidade:</span>
                  <p className="text-gray-600">{data.endereco?.cidade || '-'}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Estado:</span>
                  <p className="text-gray-600">{data.endereco?.estado || '-'}</p>
                </div>
              </div>
            </div>

            {/* Contato Alternativo */}
            {(data.contatoAlternativo?.nome || data.contatoAlternativo?.telefone) && (
              <div className="bg-gray-50 p-4 rounded-sm">
                <h3 className="font-semibold text-[#81059e] mb-3">Contato Alternativo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Nome:</span>
                    <p className="text-gray-600">{data.contatoAlternativo?.nome || '-'}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Telefone:</span>
                    <p className="text-gray-600">{formatPhone(data.contatoAlternativo?.telefone)}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Relação:</span>
                    <p className="text-gray-600">{data.contatoAlternativo?.relacao || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Informações de Dependente */}
            {!isTitular && selectedTitular && (
              <div className="bg-blue-50 p-4 rounded-sm border border-blue-200">
                <h3 className="font-semibold text-blue-700 mb-3">Informações do Dependente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Titular:</span>
                    <p className="text-gray-600">{selectedTitular.nome}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Parentesco:</span>
                    <p className="text-gray-600">{data.parentesco || 'Não especificado'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Observações */}
            {data.observacoes && (
              <div className="bg-gray-50 p-4 rounded-sm">
                <h3 className="font-semibold text-[#81059e] mb-3">Observações</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap">{data.observacoes}</p>
              </div>
            )}

            {/* Tipo de Cliente */}
            <div className="bg-green-50 p-4 rounded-sm border border-green-200">
              <h3 className="font-semibold text-green-700 mb-2">Tipo de Cadastro</h3>
              <p className="text-green-600 font-medium">
                {isTitular ? '👤 Cliente Titular' : '👥 Cliente Dependente'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Fixo */}
        <div className="flex justify-end gap-4 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#81059e] text-white rounded-sm hover:bg-[#6d0485] font-medium flex items-center gap-2"
          >
            <FiCheck size={18} />
            Confirmar Cadastro
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModalClient;