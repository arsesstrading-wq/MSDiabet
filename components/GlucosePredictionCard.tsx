

import React from 'react';
import { GeminiIcon } from './Icons';
import type { strings } from '../localization/strings';
import type { Language, ModalContent } from '../types';
import { toPersianNum } from '../utils';

interface GlucosePredictionCardProps {
  isEstimating: boolean;
  lastPrediction: { value: number; timestamp: Date } | null;
  lastComparison: { predicted: number; actual: number } | null;
  onEstimate: () => void;
  onStartComparison: (predictedValue: number) => void;
  canEstimate: boolean;
  t: (key: keyof typeof strings.fa) => string;
  language: Language;
  setModalContent: (content: ModalContent | null) => void;
}

export const GlucosePredictionCard: React.FC<GlucosePredictionCardProps> = ({ isEstimating, lastPrediction, lastComparison, onEstimate, onStartComparison, canEstimate, t, language, setModalContent }) => {
  const showExplanation = () => {
    setModalContent({
      title: t('whatIsSmartEstimation'),
      message: t('smartEstimationExplanation')
    });
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 text-center h-full flex flex-col justify-between">
      <div className="flex justify-center items-center">
        <GeminiIcon isActive className="h-6 w-6 mr-2" />
        <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{t('whatsYourBS')}</h3>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center py-2">
        {!lastPrediction && (
          <div className="w-full flex flex-col items-center justify-center">
             <button 
                onClick={onEstimate} 
                disabled={!canEstimate || isEstimating}
                className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed active:scale-95 flex-shrink-0"
                aria-label={isEstimating ? t('estimating') : t('estimateForMe')}
              >
                {isEstimating ? 
                  <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div> : 
                  <GeminiIcon isActive className="h-7 w-7" />
                }
              </button>
          </div>
        )}

        {lastPrediction && (
          <div className="animate-fade-in-down w-full px-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('estimateAt')} {lastPrediction.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-5xl font-bold my-1 text-primary-600 dark:text-primary-400">~{toPersianNum(lastPrediction.value, language)}</p>
            <button onClick={() => onStartComparison(lastPrediction.value)} className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold text-sm shadow-md hover:bg-green-700 transition-colors">
              {t('compareWithReal')}
            </button>
            <button onClick={showExplanation} className="text-xs text-gray-500 dark:text-gray-400 mt-2 hover:underline">
              {t('whatIsThis')}
            </button>
          </div>
        )}
      </div>
      
      {lastComparison && (
        <div className="mt-auto pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
            <p className="font-semibold text-center mb-2">{t('lastComparison')}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{t('estimate')}</p>
                    <p className="font-bold text-lg text-gray-800 dark:text-gray-200">{toPersianNum(lastComparison.predicted, language)}</p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{t('real')}</p>
                    <p className="font-bold text-lg text-green-500">{toPersianNum(lastComparison.actual, language)}</p>
                </div>
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{t('difference')}</p>
                    <p className={`font-bold text-lg ${Math.abs(lastComparison.predicted - lastComparison.actual) <= 20 ? 'text-green-500' : 'text-yellow-500'}`}>{toPersianNum(Math.abs(lastComparison.predicted - lastComparison.actual), language)}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};