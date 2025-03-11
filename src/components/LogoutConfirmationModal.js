"use client";
import { createPortal } from 'react-dom';

export const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    
    document.body.style.overflow = 'hidden';
    
    const handleClose = () => {
        document.body.style.overflow = 'auto';
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={handleClose}
            ></div>
            
            <div className="relative bg-white rounded-lg w-[90%] max-w-[400px]">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        Confirmar Saída
                    </h2>
                    <p className="text-gray-600 mb-6">
                        Tem certeza que deseja sair do sistema?
                    </p>
                    <div className="flex justify-end space-x-4">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                document.body.style.overflow = 'auto';
                                onConfirm();
                            }}
                            className="px-4 py-2 bg-[#84207B] text-white rounded-lg hover:bg-[#D291BC]"
                        >
                            Sair
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Verifica se estamos no navegador antes de usar createPortal
    if (typeof window === 'undefined') {
        return null;
    }

    return createPortal(modalContent, document.body);
};

export default LogoutConfirmationModal;