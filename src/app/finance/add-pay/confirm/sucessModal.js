import React, { useEffect } from 'react';
import { FiCheckCircle, FiX } from 'react-icons/fi';

const SuccessModal = ({ isOpen, onClose, message, autoClose = true, autoCloseTime = 3000 }) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseTime, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-[#81059e]">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-green-500 text-3xl bg-white rounded-full w-10 h-10 p-2 " />
            <h2 className="text-xl font-bold text-white">
              Sucesso!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-700 p-1"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FiCheckCircle className="text-green-500 text-4xl" />
            </div>
            <p className="text-gray-700 text-lg mb-2 font-semibold">
              {message || 'Conta a pagar registrada com sucesso!'}
            </p>
            <p className="text-gray-500 text-sm">
              A conta foi adicionada ao sistema e pode ser visualizada na lista de contas pendentes.
            </p>
          </div>

          {autoClose && (
            <div className="text-xs text-gray-400 mb-4">
              Este modal será fechado automaticamente em alguns segundos...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-center p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-3 bg-[#81059e] text-white rounded-sm hover:bg-[#6d0485] font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;