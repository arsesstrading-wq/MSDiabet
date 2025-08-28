

import React, { useRef } from 'react';
import type { View, SummaryTimeFrame, ColorTheme, Language, DisplayTheme, ModalContent } from '../types';
import Header from './Header';
import { MoonIcon, BellIcon, LanguageIcon, DesktopIcon, InformationCircleIcon, UploadIcon, DownloadIcon, SunIcon, TimeframeIcon } from './Icons';
import type { strings } from '../localization/strings';
import { toPersianNum } from '../utils';

interface SettingsProps {
  setView: (view: View) => void;
  displayTheme: DisplayTheme;
  setDisplayTheme: (theme: DisplayTheme) => void;
  summaryTimeFrame: SummaryTimeFrame;
  setSummaryTimeFrame: (frame: SummaryTimeFrame) => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  onThemeClick: () => void;
  onBackup: () => void;
  onRestoreFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  t: (key: keyof typeof strings.fa) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  onEnableNotifications: () => void;
  isOnline: boolean;
  setModalContent: (content: ModalContent | null) => void;
}

const SettingsScreen: React.FC<SettingsProps> = ({ 
    setView, displayTheme, setDisplayTheme, summaryTimeFrame, 
    setSummaryTimeFrame, colorTheme, setColorTheme, onThemeClick, onBackup, onRestoreFileSelect,
    t, language, setLanguage, onEnableNotifications, isOnline,
    setModalContent
}) => {
    const restoreInputRef = useRef<HTMLInputElement>(null);

    const handleRestoreClick = () => {
        restoreInputRef.current?.click();
    };

    const toggleDisplayTheme = () => {
        if (displayTheme === 'light') setDisplayTheme('dark');
        else if (displayTheme === 'dark') setDisplayTheme('auto');
        else setDisplayTheme('light');
    };

    const toggleSummaryTimeFrame = () => {
        const frames: SummaryTimeFrame[] = ['daily', 'weekly', 'monthly', 'quarterly'];
        const currentIndex = frames.indexOf(summaryTimeFrame);
        const nextIndex = (currentIndex + 1) % frames.length;
        setSummaryTimeFrame(frames[nextIndex]);
    };

    const timeFrameDetails: Record<SummaryTimeFrame, { icon: React.ReactNode; titleKey: keyof typeof strings.fa }> = {
        daily: { icon: <TimeframeIcon timeframe='daily' className="h-7 w-7" />, titleKey: 'timeFrame_daily' },
        weekly: { icon: <TimeframeIcon timeframe='weekly' className="h-7 w-7" />, titleKey: 'timeFrame_weekly' },
        monthly: { icon: <TimeframeIcon timeframe='monthly' className="h-7 w-7" />, titleKey: 'timeFrame_monthly' },
        quarterly: { icon: <TimeframeIcon timeframe='quarterly' className="h-7 w-7" />, titleKey: 'timeFrame_quarterly' },
    };
    
    const QuickSettingButton: React.FC<{ title: string; onClick: () => void; children: React.ReactNode, disabled?: boolean }> = ({ title, onClick, children, disabled }) => (
      <button onClick={onClick} title={title} disabled={disabled} className="flex flex-col items-center justify-center p-2 w-16 h-16 rounded-full transition-colors duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
          {children}
      </button>
    );

    const handleAboutClick = () => {
      setModalContent({
        title: t('aboutAppTitle'),
        message: t('aboutAppMessage'),
      });
    };

    return (
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
        <Header title={t('settingsTitle')} onBack={() => setView('dashboard')} />
        <div className="p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto no-scrollbar space-y-4 pb-24">
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold mb-3">{t('quickSettings')}</h3>
                <div className="flex justify-around items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-800/50">
                    <div className="flex flex-col items-center opacity-60">
                        <QuickSettingButton title={t('language')} onClick={() => {}} disabled>
                            <LanguageIcon className="h-7 w-7" />
                        </QuickSettingButton>
                        <span className="text-xs -mt-2 text-gray-500 dark:text-gray-400">{t('comingSoon')}</span>
                    </div>
                    <QuickSettingButton title={t('notifications')} onClick={onEnableNotifications}>
                        <BellIcon className="h-7 w-7" />
                    </QuickSettingButton>
                    <QuickSettingButton title={t('changeTheme')} onClick={onThemeClick}>
                        <div className="w-7 h-7 rounded-full border border-gray-300 dark:border-gray-500" style={{ backgroundColor: 'var(--color-primary-600-val)' }} />
                    </QuickSettingButton>
                    <QuickSettingButton title={displayTheme === 'light' ? t('darkMode') : displayTheme === 'dark' ? t('autoMode') : t('lightMode')} onClick={toggleDisplayTheme}>
                        {displayTheme === 'light' && <MoonIcon className="h-7 w-7" />}
                        {displayTheme === 'dark' && <SunIcon className="h-7 w-7" />}
                        {displayTheme === 'auto' && <DesktopIcon className="h-7 w-7" />}
                    </QuickSettingButton>
                     <QuickSettingButton title={`${t('summaryTimeframe')}: ${t(timeFrameDetails[summaryTimeFrame].titleKey)}`} onClick={toggleSummaryTimeFrame}>
                        {timeFrameDetails[summaryTimeFrame].icon}
                    </QuickSettingButton>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold mb-3">{t('aiAssistant')}</h3>
                <div className="flex justify-between items-center opacity-60">
                    <label htmlFor="ai-toggle" className="text-gray-700 dark:text-gray-200 flex-1 cursor-not-allowed">
                        {t('aiAssistantDesc')} ({t('comingSoon')})
                    </label>
                    <button
                        id="ai-toggle"
                        disabled
                        className="relative inline-flex items-center h-6 rounded-full w-11 cursor-not-allowed bg-gray-300 dark:bg-gray-600"
                        aria-checked={false}
                        role="switch"
                    >
                        <span
                            className="inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ltr:translate-x-1 rtl:-translate-x-1"
                        />
                    </button>
                </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold mb-3">{t('backupRestore')}</h3>
                <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex-grow ltr:mr-4 rtl:ml-4">{t('backupRestoreDesc')}</p>
                    <div className="flex flex-col space-y-2 flex-shrink-0">
                         <button 
                            onClick={onBackup} 
                            className="p-3 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 rounded-full hover:bg-primary-200 dark:hover:bg-primary-900/80 transition-colors"
                            title={t('backup')}
                            aria-label={t('backup')}
                        >
                            <UploadIcon className="h-6 w-6" />
                         </button>
                         <button 
                            onClick={handleRestoreClick} 
                            className="p-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            title={t('restore')}
                            aria-label={t('restore')}
                        >
                            <DownloadIcon className="h-6 w-6" />
                         </button>
                    </div>
                </div>
                <input
                    type="file"
                    ref={restoreInputRef}
                    className="hidden"
                    accept=".json,application/json"
                    onChange={onRestoreFileSelect}
                />
            </div>
            
            <button onClick={handleAboutClick} className="w-full flex items-center text-left rtl:text-right p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/40 rounded-lg text-primary-600 dark:text-primary-400 ltr:mr-4 rtl:ml-4">
                    <InformationCircleIcon className="h-6 w-6"/>
                </div>
                <div>
                    <h3 className="font-bold">{t('aboutAppTitle')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('appName')}</p>
                </div>
            </button>

            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-2">{t('contactUs')}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{t('contactUsDesc')}</p>
              <div className="space-y-3">
                <a
                  href="https://eitaa.com/joinchat/3165061499C9405f05df1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center py-3 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 shadow-md font-semibold"
                >
                  {t('eitaaGroup')}
                </a>
                <a
                  href="https://eitaa.com/t11396"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center py-3 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 shadow-md font-semibold"
                >
                  {t('eitaaChannel')}
                </a>
              </div>
            </div>
            <div className="mt-auto pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
              <p className="mb-2">{t('version')}: {toPersianNum('14040528', language)}</p>
              <a href="https://wa.me/989155529985" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition-colors duration-200">ایده پردازی و توسعه توسط سید صابر ایوبی</a>
            </div>
        </div>
      </div>
    );
}

export default SettingsScreen;
