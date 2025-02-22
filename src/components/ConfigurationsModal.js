// components/modals/ConfigModal.js
"use client";
export const ConfigurationsModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    
    document.body.style.overflow = 'hidden';
    
    const handleClose = () => {
        document.body.style.overflow = 'auto';
        onClose();
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50"
                onClick={handleClose}
            ></div>
            
            <div className="relative bg-white rounded-lg w-[90%] max-w-[500px] max-h-[90vh]">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Configurações</h2>
                        <button 
                            onClick={handleClose}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>
                    
                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-medium text-gray-900">
                                Preferências do Sistema
                            </h3>
                            <div className="mt-4 space-y-4">
                                {/* Opções de configuração */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default ConfigurationsModal;