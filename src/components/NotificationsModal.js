"use client";
import { createPortal } from 'react-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const NotificationsModal = ({ isOpen, onClose, notifications }) => {
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
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Nenhuma notificação
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 rounded-lg ${notification.read
                                                ? 'bg-gray-50'
                                                : 'bg-purple-50'
                                            }`}
                                    >
                                        <h3 className={`font-medium ${notification.read
                                                ? 'text-gray-900'
                                                : 'text-purple-900'
                                            }`}>
                                            {notification.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {notification.message}
                                        </p>
                                        <span className="text-xs text-gray-500 mt-2 block">
                                            {formatDistanceToNow(notification.createdAt, {
                                                addSuffix: true,
                                                locale: ptBR
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    if (typeof window === 'undefined') {
        return null;
    }

    return createPortal(modalContent, document.body);
};

export default NotificationsModal;