
import React from 'react';

interface ConfirmationModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center rtl">
      <p className="text-lg text-gray-800 dark:text-gray-100 mb-6 text-right">{message}</p>
      <div className="flex justify-center space-x-4 rtl:space-x-reverse">
        <button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 font-semibold">
          خیر
        </button>
        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200 font-semibold">
          بله
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmationModal;
