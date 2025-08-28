
import React from 'react';
import type { Language } from '../types';

interface InfoModalProps {
  title: string;
  message: string;
  onClose: () => void;
  language: Language;
}

const markdownToHtml = (text: string): string => {
  // Replace newlines that are not part of a list for <br>
  let html = text.replace(/(\r\n|\r|\n)/g, '<br />');

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // List items * or -
  html = html.replace(/<br \/>(\*|-)\s(.*?)(?=<br \/>|$)/g, '<li>$2</li>');
  
  // Wrap list items in <ul>
  // This regex is tricky. A simpler approach is to wrap adjacent <li>s
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  // And remove <br> inside the ul
  html = html.replace(/<ul><br \/>/g, '<ul>').replace(/<\/li><br \/>/g, '</li>');

  return html;
};

const InfoModal: React.FC<InfoModalProps> = ({ title, message, onClose, language }) => {
  const formattedMessage = markdownToHtml(message);
  const directionClass = language === 'fa' ? 'rtl text-right' : 'ltr text-left';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col ${directionClass}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-gray-700`}>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 transition-colors duration-200 p-1 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto ltr:pr-2 rtl:pl-2">
            <div className="text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: formattedMessage }}></div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;