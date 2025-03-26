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

            <div className="relative bg-white rounded-sm w-full max-w-md flex flex-col h-44">
                <div>
                    <h2 className="bg-[#81059e] text-white p-4 items-center text-xl font-bold rounded-t-sm">
                        Confirmar Saída
                    </h2>
                    <div className='p-4'>
                        <p className="text-gray-600 mb-6">
                            Tem certeza que deseja sair do sistema?
                        </p>
                        <div className="flex justify-end space-x-4">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-[#81059e] rounded-sm hover:text-[#D291BC]"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    document.body.style.overflow = 'auto';
                                    onConfirm();
                                }}
                                className="px-6 py-2 bg-[#84207B] text-white rounded-sm hover:bg-[#D291BC]"
                            >
                                Sair
                            </button>
                        </div>
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