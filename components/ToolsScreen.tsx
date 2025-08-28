

import React from 'react';
import type { View } from '../types';
import Header from './Header';
import { ToolCalculatorIcon, ToolAiIcon, ToolChartIcon, ToolCarbTableIcon, TrophyIcon, EmergencyIcon, DocumentTextIcon, IdCardIcon, BookOpenIcon } from './Icons';
import type { strings } from '../localization/strings';

interface ToolsScreenProps {
  setView: (view: View, payload?: any) => void;
  isAiEnabled: boolean;
  t: (key: keyof typeof strings.fa) => string;
}

const ToolCard: React.FC<{ title: string; description: string; icon: React.ReactNode; onClick: () => void; disabled?: boolean }> = ({ title, description, icon, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-2 px-3 flex items-center space-x-3 rtl:space-x-reverse transition-colors duration-200 text-left rtl:text-right border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
    >
        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/50 rounded-lg text-primary-600 dark:text-primary-300">
            {icon}
        </div>
        <div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    </button>
);


const ToolsScreen: React.FC<ToolsScreenProps> = ({ setView, isAiEnabled, t }) => {
  const tools: { view: View; title: string; description: string; icon: React.ReactNode; enabled: boolean }[] = [
    { view: 'aiTools', title: t('aiAssistant'), description: t('aiToolsDesc'), icon: <ToolAiIcon className="h-6 w-6" />, enabled: isAiEnabled },
    { view: 'goals', title: t('goalsAndAchievements'), description: t('goalsAndAchievementsDesc'), icon: <TrophyIcon className="h-6 w-6" />, enabled: true },
    { view: 'emergency', title: t('emergencyMode'), description: t('emergencyModeDesc'), icon: <EmergencyIcon className="h-6 w-6" />, enabled: true },
    { view: 'correctionDoseCalculator', title: t('doseCalculator'), description: t('doseCalculatorDesc'), icon: <ToolCalculatorIcon className="h-6 w-6" />, enabled: true },
    { view: 'graph', title: t('chartsAndReports'), description: t('chartsAndReportsDesc'), icon: <ToolChartIcon className="h-6 w-6" />, enabled: true },
    { view: 'reportPreview', title: t('comprehensiveReportForDoctor'), description: t('comprehensiveReportForDoctorDesc'), icon: <DocumentTextIcon className="h-6 w-6" />, enabled: true },
    { view: 'carbTable', title: t('carbTable'), description: t('carbTableDesc'), icon: <ToolCarbTableIcon className="h-6 w-6" />, enabled: true },
    { view: 'diabetesIdCard', title: t('diabetesIdCardTool'), description: t('diabetesIdCardToolDesc'), icon: <IdCardIcon className="h-6 w-6" />, enabled: true },
    { view: 'diabetesEncyclopedia', title: t('diabetesEncyclopedia'), description: t('diabetesEncyclopediaDesc'), icon: <BookOpenIcon className="h-6 w-6" />, enabled: true },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header 
        title={t('appName')}
        onBack={() => setView('dashboard')} 
      />
      <div className="p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {tools.filter(tool => tool.enabled).map(tool => (
              <ToolCard 
                key={tool.view}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                onClick={() => setView(tool.view)}
              />
            ))}
          </div>
      </div>
    </div>
  );
};

export default ToolsScreen;