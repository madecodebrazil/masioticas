"use client";
import { createPortal } from 'react-dom';

export const NotificationsModal = ({ isOpen, onClose }) => {
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
            
            <div className="relative bg-white rounded-lg w-[90%] max-w-[500px] max-h-[90vh]">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Notificações</h2>
                        <button 
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                        <div className="space-y-4">
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <h3 className="font-medium text-purple-900">Nova venda realizada</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Venda #1234 foi finalizada com sucesso
                                </p>
                                <span className="text-xs text-gray-500 mt-2 block">
                                    2 minutos atrás
                                </span>
                            </div>
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

export default NotificationsModal;