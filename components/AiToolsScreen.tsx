

import React from 'react';
import type { View } from '../types';
import Header from './Header';
import { ChatIcon, GraphIcon, CameraIcon, ToolAiIcon, LightbulbIcon, ToolCalculatorIcon } from './Icons';
import type { strings } from '../localization/strings';

interface AiToolsScreenProps {
  setView: (view: View, payload?: any) => void;
  onShowDailyTip: () => void;
  t: (key: keyof typeof strings.fa) => string;
}

const ToolCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean }> = ({ title, description, icon, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm flex items-center space-x-4 rtl:space-x-reverse transition-all duration-200 text-left rtl:text-right ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:shadow-md'}`}
    >
        <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
            {icon}
        </div>
        <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    </button>
);

const AiToolsScreen: React.FC<AiToolsScreenProps> = ({ setView, onShowDailyTip, t }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header 
        title={t('aiAssistant')}
        onBack={() => setView('tools')} 
      />
      <div className="p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto space-y-4">
          <ToolCard 
            title={t('healthChatbot')}
            description={t('healthChatbotDesc')}
            icon={<ChatIcon />}
            onClick={() => setView('chatbot')}
          />
          <ToolCard 
            title={t('futurePrediction')}
            description={t('futurePredictionDesc')}
            icon={<GraphIcon className="h-8 w-8" />}
            onClick={() => alert(t('comingSoon'))} // Placeholder
          />
          <ToolCard 
            title={t('smartAnalysis')}
            description={t('smartAnalysisDesc')}
            icon={<ToolAiIcon />}
            onClick={() => setView('aiAnalysis')}
          />
          <ToolCard 
            title={t('smartMealDose')}
            description={t('smartDoseDescShort')}
            icon={<ToolCalculatorIcon className="h-8 w-8" />}
            onClick={() => setView('correctionDoseCalculator')}
          />
           <ToolCard 
            title={t('dailyTipAndChallenge')}
            description={t('dailyTipAndChallengeDesc')}
            icon={<LightbulbIcon className="h-8 w-8" />}
            onClick={onShowDailyTip}
          />
          <ToolCard 
            title={t('carbCountWithCamera')}
            description={t('carbCountWithCameraDesc')}
            icon={<CameraIcon />}
            onClick={() => setView('logMeal', { startWithCamera: true })}
          />
      </div>
    </div>
  );
};

export default AiToolsScreen;