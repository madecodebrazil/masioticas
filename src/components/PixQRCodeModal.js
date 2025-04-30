// src/components/PixQRCodeModal.js
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiX, FiCopy, FiCheckCircle } from 'react-icons/fi';

const PixQRCodeModal = ({ 
  isOpen, 
  onClose, 
  value, 
  onConfirm,
  formatCurrency 
}) => {
  const [copied, setCopied] = useState(false);
  const mockPixKey = 'masi.oticas@exemplo.com.br';
  
  // Simulação de QR Code - em produção, você substituiria isso por um QR Code real
  // gerado pelo seu backend ou serviço de pagamento
  const qrCodeSrc = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + 
    encodeURIComponent(`PIX;${mockPixKey};${value};MASI Óticas`);
  
  if (!isOpen) return null;
  
  const copyPixKey = () => {
    navigator.clipboard.writeText(mockPixKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#81059e]">Pagamento PIX</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>
        
        <div className="text-center mb-4">
          <p className="mb-2">Valor a pagar:</p>
          <p className="text-2xl font-bold text-[#81059e]">{formatCurrency(value)}</p>
        </div>
        
        <div className="flex justify-center mb-4">
          <div className="border-2 border-[#81059e] p-2 rounded-lg">
            <img 
              src={qrCodeSrc} 
              alt="QR Code PIX"
              width={200}
              height={200}
              className="mx-auto"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-center mb-2">Ou use a chave PIX:</p>
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
            <span className="text-sm font-mono">{mockPixKey}</span>
            <button 
              onClick={copyPixKey} 
              className="ml-2 text-[#81059e] hover:text-[#6f0486]"
              title="Copiar chave PIX"
            >
              {copied ? <FiCheckCircle size={20} /> : <FiCopy size={20} />}
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-6">
          <p className="mb-2">Instruções:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Abra o aplicativo do seu banco</li>
            <li>Selecione a opção de pagamento via PIX</li>
            <li>Escaneie o QR code ou copie a chave PIX</li>
            <li>Confirme o valor e finalize o pagamento</li>
          </ol>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="text-[#81059e] hover:opacity-70 p-2"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-[#81059e] text-white rounded-sm hover:bg-[#6f0486]"
          >
            Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default PixQRCodeModal;