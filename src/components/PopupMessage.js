import React from 'react';

const PopupMessage = ({ message, onClose }) => {
    return (
        <div className="fixed top-4 right-4 bg-transparent z-50">
            <div className="bg-red-500 text-white p-3 rounded-lg shadow-md flex items-center space-x-3 max-w-xs">
                <p className="flex-1 text-sm">{message}</p>
                <button
                    onClick={onClose}
                    className="text-white bg-red-600 hover:bg-red-700 rounded-full w-6 h-6 flex items-center justify-center"
                    aria-label="Close"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default PopupMessage;
