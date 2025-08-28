
import React from 'react';
import Header from './Header';
import { GeminiIcon } from './Icons';
import type { View } from '../types';
import type { strings } from '../localization/strings';

interface AiAnalysisScreenProps {
  setView: (view: View) => void;
  onAnalyzeClick: () => void;
  isAnalyzing: boolean;
  analysisResult: string | null;
  t: (key: keyof typeof strings.fa) => string;
}

const markdownToHtml = (text: string): string => {
  if (!text) return '';
  let html = text.replace(/(\r\n|\r|\n)/g, '<br />');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/<br \/>(\d\.|-|\*)\s(.*?)(?=<br \/>|$)/g, '<li>$2</li>');
  html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/<ul><br \/>/g, '<ul>').replace(/<\/li><br \/>/g, '</li>');
  return html;
};

const AiAnalysisScreen: React.FC<AiAnalysisScreenProps> = ({ setView, onAnalyzeClick, isAnalyzing, analysisResult, t }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header title={t('aiAnalysisTitle')} onBack={() => setView('tools')} />
      <div className="p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="animate-spin h-10 w-10 text-primary-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('analyzing')}...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait a moment.</p>
          </div>
        ) : analysisResult ? (
          <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: markdownToHtml(analysisResult) }}></div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center h-full">
            <GeminiIcon isActive className="h-16 w-16 text-primary-500 mb-6" />
            <h2 className="text-2xl font-bold mb-3">{t('aiAnalysisWelcome')}</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
              {t('aiAnalysisDesc')}
            </p>
            <button
              onClick={onAnalyzeClick}
              className="bg-primary-600 text-white py-3 px-8 rounded-lg font-bold text-lg shadow-md hover:bg-primary-700 transition-all duration-200"
            >
              {t('startAnalysis')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAnalysisScreen;