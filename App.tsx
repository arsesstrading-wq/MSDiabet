

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { View, User, LogEntry, ModalContent, SummaryTimeFrame, Profile, ColorTheme, Language, DisplayTheme } from './types';
import { DEFAULT_PROFILE, themeColorPalettes } from './constants';
import { 
    SettingsIcon, AlertIcon, GlucoseMeterIcon, UserIcon, PlusIcon,
    HistoryIcon, BloodDropIcon, MealIcon, ActivityIcon, SleepIcon,
    SyringeIcon, MoodIcon, GridIcon, CheckIcon, MedicationIcon, BodyIcon
} from './components/Icons';
import { analyzeDataWithGemini, estimateGlucoseWithGemini, getDailyTipWithGemini } from './services/geminiService';
import { strings } from './localization/strings';
import dynamicStrings from './localization/dynamicStrings';
import { toEnglishNum } from './utils';

// Import Screens
import Dashboard from './components/Dashboard';
import ProfileScreen from './components/ProfileScreen';
import SettingsScreen from './components/SettingsScreen';
import LogBloodSugarScreen from './components/LogBloodSugarScreen';
import LogMealScreen from './components/LogMealScreen';
import LogActivityScreen from './components/LogActivityScreen';
import LogSleepScreen from './components/LogSleepScreen';
import LogInsulinScreen from './components/LogInsulinScreen';
import LogMoodScreen from './components/LogMoodScreen';
import LogMedicationScreen from './components/LogMedicationScreen';
import LogPhysicalConditionScreen from './components/LogPhysicalConditionScreen';
import GraphScreen from './components/GraphScreen';
import InfoModal from './components/InfoModal';
import LogHistoryScreen from './components/LogHistoryScreen';
import ConfirmationModal from './components/ConfirmationModal';
import CorrectionDoseCalculator from './components/CorrectionDoseCalculator';
import AiAnalysisScreen from './components/AiAnalysisScreen';
import ToolsScreen from './components/ToolsScreen';
import CarbTableScreen from './components/CarbTableScreen';
import ComprehensiveReportGenerator from './components/ComprehensiveReportGenerator';
import AiToolsScreen from './components/AiToolsScreen';
import ChatbotScreen from './components/ChatbotScreen';
import EmergencyScreen from './components/EmergencyScreen';
import GoalsScreen from './components/GoalsScreen';
import DiabetesIdCardScreen from './components/DiabetesIdCardScreen';
import DiabetesEncyclopediaScreen from './components/DiabetesEncyclopediaScreen';


const calculateAge = (birthDateStr?: string): number | null => {
    if (!birthDateStr || !birthDateStr.includes('/')) return null;
    try {
        const birthYear = parseInt(toEnglishNum(birthDateStr).split('/')[0], 10);
        const currentJalaliYearStr = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0];
        const currentJalaliYear = parseInt(currentJalaliYearStr, 10);
        
        if (isNaN(birthYear) || isNaN(currentJalaliYear)) {
             return null;
        }
        
        const age = currentJalaliYear - birthYear;
        return age >= 0 && age < 120 ? age : null;
    } catch {
        return null;
    }
};

const daysInJalaliMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
const getDayOfYear = (m: number, d: number): number => {
    if (m < 1 || m > 12 || d < 1 || d > daysInJalaliMonth[m - 1]) return 0; // Basic validation
    return daysInJalaliMonth.slice(0, m - 1).reduce((a, b) => a + b, 0) + d;
};

// Returns true if the current date is in the second half of the menstrual cycle
const isInLutealPhase = (profile: Profile): boolean => {
    if (profile.gender !== 'female' || !profile.lastPeriodStartDate || !profile.cycleLength) {
        return false;
    }

    try {
        const cycleLength = parseInt(toEnglishNum(profile.cycleLength), 10);
        if (isNaN(cycleLength) || cycleLength <= 0) return false;

        const lastPeriodStr = toEnglishNum(profile.lastPeriodStartDate);
        const todayJalaliStr = toEnglishNum(new Date().toLocaleDateString('fa-IR-u-nu-latn').split(' ')[0]);

        if (!/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(lastPeriodStr)) return false;

        const [lastY, lastM, lastD] = lastPeriodStr.split('/').map(Number);
        const [currentY, currentM, currentD] = todayJalaliStr.split('/').map(Number);
        
        const dayOfYearLast = getDayOfYear(lastM, lastD);
        const dayOfYearCurrent = getDayOfYear(currentM, currentD);
        if (dayOfYearLast === 0 || dayOfYearCurrent === 0) return false;

        let daysPassed;
        if (currentY > lastY) {
            const daysInLastYear = 365; // Simplified, ignores leap years
            daysPassed = (daysInLastYear - dayOfYearLast) + dayOfYearCurrent;
        } else if (currentY === lastY) {
            daysPassed = dayOfYearCurrent - dayOfYearLast;
        } else {
             return false; // Last period date is in the future
        }

        if (daysPassed < 0 || daysPassed > 365) return false; // Sanity check

        const dayInCycle = daysPassed % cycleLength;
        return dayInCycle > (cycleLength / 2);

    } catch {
        return false;
    }
};

const BottomNavBar: React.FC<{
    activeView: View;
    setView: (view: View) => void;
    onAddClick: () => void;
    t: (key: keyof typeof strings.fa) => string;
}> = ({ activeView, setView, onAddClick, t }) => {
    const navItems = [
        { view: 'dashboard', label: t('navDashboard'), icon: GlucoseMeterIcon },
        { view: 'logHistory', label: t('navHistory'), icon: HistoryIcon },
        { view: 'add-placeholder', label: '', icon: () => null }, // Placeholder for the central button
        { view: 'tools', label: t('navTools'), icon: GridIcon },
        { view: 'profile', label: t('navProfile'), icon: UserIcon }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.2)] flex justify-around items-center z-20">
            <div className="absolute bottom-6 z-30">
                <button
                    onClick={onAddClick}
                    className="bg-primary-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-primary-700 active:scale-95 transition-all duration-200"
                    aria-label={t('newLog')}
                >
                    <PlusIcon className="h-8 w-8" />
                </button>
            </div>
            {navItems.map((item) => {
                const isActive = activeView === item.view;
                return (
                    <button
                        key={item.view}
                        onClick={() => item.view !== 'add-placeholder' && setView(item.view as View)}
                        className="flex flex-col items-center justify-center w-1/5 h-full transition-colors duration-200 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                        {item.view !== 'add-placeholder' && <item.icon isActive={isActive} className="h-6 w-6" />}
                        <span className={`text-xs mt-1 ${isActive ? 'text-primary-600 dark:text-primary-400 font-semibold' : ''}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

const LogMenu: React.FC<{ onClose: () => void; onSelect: (view: View) => void; t: (key: keyof typeof strings.fa) => string; }> = ({ onClose, onSelect, t }) => {
  const menuItems: { view: View; label: string; icon: React.FC<{ className?: string }>; color: string; }[] = [
    { view: 'logBloodSugar', label: t('logMenuBloodSugar'), icon: BloodDropIcon, color: 'text-primary-600 dark:text-primary-400' },
    { view: 'logMeal', label: t('logMenuMeal'), icon: MealIcon, color: 'text-primary-600 dark:text-primary-400' },
    { view: 'logInsulin', label: t('logMenuInsulin'), icon: SyringeIcon, color: 'text-primary-600 dark:text-primary-400' },
    { view: 'logActivity', label: t('logMenuActivity'), icon: ActivityIcon, color: 'text-primary-600 dark:text-primary-400' },
    { view: 'logMood', label: t('logMenuMood'), icon: MoodIcon, color: 'text-primary-600 dark:text-primary-400' },
    { view: 'logPhysicalCondition', label: t('logMenuPhysicalCondition'), icon: BodyIcon, color: 'text-primary-600 dark:text-primary-400' },
    { view: 'logMedication', label: t('logMenuMedication'), icon: MedicationIcon, color: 'text-primary-600 dark:text-primary-400' },
    { view: 'logSleep', label: t('logMenuSleep'), icon: SleepIcon, color: 'text-primary-600 dark:text-primary-400' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-30" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 w-full rounded-t-2xl p-4 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <span className="inline-block w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
          <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-gray-100">{t('logMenuTitle')}</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {menuItems.map(item => (
            <button key={item.view} onClick={() => onSelect(item.view)} className="flex flex-col items-center justify-center text-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
              <item.icon className={`h-8 w-8 mb-2 ${item.color}`} />
              <span className="text-xs font-semibold mt-1 text-gray-700 dark:text-gray-300">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [viewPayload, setViewPayload] = useState<any>(null);
  const [displayTheme, setDisplayTheme] = useState<DisplayTheme>('light');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [colorTheme, setColorTheme] = useState<ColorTheme>('indigo');
  const [language, setLanguage] = useState<Language>('fa');
  const [summaryTimeFrame, setSummaryTimeFrame] = useState<SummaryTimeFrame>('daily');
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState<boolean>(false);
  const [lastPrediction, setLastPrediction] = useState<{ value: number; timestamp: Date } | null>(null);
  const [pendingPrediction, setPendingPrediction] = useState<number | null>(null);
  const [isLogMenuOpen, setIsLogMenuOpen] = useState(false);
  const [restoreData, setRestoreData] = useState<string | null>(null);
  const [showRestoreConfirmation, setShowRestoreConfirmation] = useState(false);
  const [dailyTip, setDailyTip] = useState<{ tip: string; date: string } | null>(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  const isAiEnabled = false;

  const t = useCallback((key: keyof typeof strings.fa): string => {
    return strings[language][key] || strings['en'][key] || key;
  }, [language]);

  const dynamicT = dynamicStrings[language];

  useEffect(() => {
    // Online/Offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Load users and settings from local storage
    try {
        const storedUsers = localStorage.getItem('diab-users');
        const storedSelectedId = localStorage.getItem('diab-selectedUserId');
        const storedDisplayTheme = localStorage.getItem('diab-displayTheme') as DisplayTheme;
        const storedColorTheme = localStorage.getItem('diab-colorTheme') as ColorTheme;
        const storedLanguage = localStorage.getItem('diab-language') as Language;
        const storedTimeFrame = localStorage.getItem('diab-summaryTimeFrame') as SummaryTimeFrame;

        let parsedUsers: User[] = [];
        if (storedUsers) {
            parsedUsers = JSON.parse(storedUsers).map((u: any) => ({
                ...u,
                profile: { ...DEFAULT_PROFILE, ...u.profile },
                logs: (u.logs || []).map((l: any) => ({...l, timestamp: new Date(l.timestamp)})),
                reminders: u.reminders || [],
                goals: u.goals || [],
            }));
        }

        if (parsedUsers.length === 0) {
            const firstUser: User = { id: `user_${Date.now()}`, name: 'My Sweet Dream', profile: DEFAULT_PROFILE, logs: [], reminders: [], goals: [] };
            parsedUsers.push(firstUser);
            setUsers(parsedUsers);
            setSelectedUserId(firstUser.id);
        } else {
            setUsers(parsedUsers);
            if(storedSelectedId && parsedUsers.some(u => u.id === storedSelectedId)) {
                setSelectedUserId(storedSelectedId);
            } else if (parsedUsers.length > 0) {
                setSelectedUserId(parsedUsers[0].id);
            }
        }
        
        if (storedDisplayTheme && ['light', 'dark', 'auto'].includes(storedDisplayTheme)) {
            setDisplayTheme(storedDisplayTheme);
        }
        if (storedLanguage && ['fa', 'en'].includes(storedLanguage)) {
            setLanguage(storedLanguage);
        }
        if (storedColorTheme && Object.keys(themeColorPalettes).includes(storedColorTheme)) {
            setColorTheme(storedColorTheme);
        }
        if (storedTimeFrame && ['daily', 'weekly', 'monthly', 'quarterly'].includes(storedTimeFrame)) {
            setSummaryTimeFrame(storedTimeFrame);
        }

    } catch (error) {
        console.error("Failed to load data from localStorage", error);
    } finally {
        setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    // Persist state to local storage on change
    if (loading) return;
    try {
        localStorage.setItem('diab-users', JSON.stringify(users));
        if(selectedUserId) localStorage.setItem('diab-selectedUserId', selectedUserId);
        localStorage.setItem('diab-displayTheme', displayTheme);
        localStorage.setItem('diab-colorTheme', colorTheme);
        localStorage.setItem('diab-language', language);
        localStorage.setItem('diab-summaryTimeFrame', summaryTimeFrame);
    } catch (error) {
        console.error("Failed to save data to localStorage", error);
    }
  }, [users, selectedUserId, displayTheme, colorTheme, language, summaryTimeFrame, loading]);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (isDark: boolean) => {
        setIsDarkMode(isDark);
        if (isDark) root.classList.add('dark');
        else root.classList.remove('dark');
    };

    if (displayTheme === 'auto') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    } else {
        applyTheme(displayTheme === 'dark');
    }
  }, [displayTheme]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'fa' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    const root = document.documentElement;
    const colors = themeColorPalettes[colorTheme];
    Object.entries(colors).forEach(([key, value]) => {
      const propKey = key.includes('-val') ? `--color-primary-${key}` : `--color-primary-${key}`;
      root.style.setProperty(propKey, value);
    });
  }, [colorTheme]);

  useEffect(() => { if (view !== 'aiAnalysis') setAiAnalysisResult(null); }, [view]);
  useEffect(() => { if (restoreData) setShowRestoreConfirmation(true); }, [restoreData]);
  
  const handleSetView = (view: View, payload: any = null) => {
    setView(view);
    setViewPayload(payload);
  };

  const currentUser = users.find(u => u.id === selectedUserId);

  const handleAddUser = (name: string) => {
    if (users.length < 3) {
      const newUser: User = { id: `user_${Date.now()}`, name, profile: DEFAULT_PROFILE, logs: [], reminders: [], goals: [] };
      const newUsers = [...users, newUser];
      setUsers(newUsers);
      setSelectedUserId(newUser.id);
    }
  };
  
  const handleUpdateUser = (updatedUser: User) => {
      setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (userIdToDelete: string) => {
    if (users.length > 1) {
      const newUsers = users.filter(u => u.id !== userIdToDelete);
      setUsers(newUsers);
      if (selectedUserId === userIdToDelete) {
        setSelectedUserId(newUsers[0]?.id || null);
      }
    }
  };

  const handleSaveLog = (logData: Omit<LogEntry, 'id' | 'timestamp'>) => {
    if (!currentUser) return;
    let finalLogData: Omit<LogEntry, 'id' | 'timestamp'> = { ...logData };
    if (logData.type === 'bloodSugar' && pendingPrediction !== null) {
        finalLogData.predictedGlucose = pendingPrediction;
        setPendingPrediction(null);
        setLastPrediction(null);
    }
    
    if (editingLog) {
      const updatedLogs = currentUser.logs.map(log => log.id === editingLog.id ? { ...log, ...finalLogData, timestamp: new Date() } : log);
      handleUpdateUser({ ...currentUser, logs: updatedLogs });
    } else {
      const newLog: LogEntry = { ...finalLogData, id: `log_${Date.now()}`, timestamp: new Date() } as LogEntry;
      handleUpdateUser({ ...currentUser, logs: [...currentUser.logs, newLog] });
    }
  };

  const handleStartEditLog = (log: LogEntry) => {
    setEditingLog(log);
    if (log.type === 'bloodSugar') handleSetView('logBloodSugar');
    else if (log.type === 'meal') handleSetView('logMeal');
    else if (log.type === 'activity') handleSetView('logActivity');
    else if (log.type === 'sleep') handleSetView('logSleep');
    else if (log.type === 'insulin') handleSetView('logInsulin');
    else if (log.type === 'mood') handleSetView('logMood');
    else if (log.type === 'medication') handleSetView('logMedication');
    else if (log.type === 'physicalCondition') handleSetView('logPhysicalCondition');
  };

  const handleDeleteLogConfirm = () => {
    if (!deletingLogId || !currentUser) return;
    const updatedLogs = currentUser.logs.filter(log => log.id !== deletingLogId);
    handleUpdateUser({ ...currentUser, logs: updatedLogs });
    setDeletingLogId(null);
  };
  
  const handleRunAnalysis = async () => {
    if (!currentUser || isAnalyzing) return;
    setIsAnalyzing(true);
    setAiAnalysisResult(null); 
    try {
        const analysis = await analyzeDataWithGemini(currentUser);
        setAiAnalysisResult(analysis);
    } catch (error) {
        console.error("AI Analysis failed:", error);
        setAiAnalysisResult(t('aiError'));
    } finally {
        setIsAnalyzing(false);
    }
  };
  
  const handleEstimate = async () => {
    if (!currentUser || isEstimating || !isAiEnabled) return;
    setIsEstimating(true);
    setLastPrediction(null);
    const estimatedValue = await estimateGlucoseWithGemini(currentUser);
    if (estimatedValue !== null) {
        setLastPrediction({ value: estimatedValue, timestamp: new Date() });
    } else {
        setModalContent({ title: t('error'), message: "AI could not estimate your blood sugar. Please ensure your recent data is complete and try again." });
    }
    setIsEstimating(false);
  };

  const handleStartComparison = (predictedValue: number) => {
      setPendingPrediction(predictedValue);
      handleSetView('logBloodSugar');
  };

  const handleThemeClick = () => {
    const themes: ColorTheme[] = ['indigo', 'pink', 'blue', 'green', 'orange', 'teal', 'red', 'amber', 'rose', 'slate'];
    const currentIndex = themes.indexOf(colorTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setColorTheme(themes[nextIndex]);
  };

  const getBackupData = useCallback(() => {
    return JSON.stringify({ users, selectedUserId, displayTheme, colorTheme, summaryTimeFrame, language, version: 1, backupDate: new Date().toISOString() }, null, 2);
  }, [users, selectedUserId, displayTheme, colorTheme, summaryTimeFrame, language]);

  const handleBackup = useCallback(() => {
    try {
        const backupData = getBackupData();
        const blob = new Blob([backupData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `royaye-shirin-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setModalContent({ title: t('success'), message: t('backupSuccess') });
    } catch (error) {
        console.error("Backup failed:", error);
        setModalContent({ title: t('error'), message: t('backupError') });
    }
  }, [getBackupData, t]);

  const handleFileSelectForRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            if (typeof text === 'string') setRestoreData(text);
        };
        reader.readAsText(file);
    }
    event.target.value = '';
  };
  
  const confirmRestore = () => {
    if (!restoreData) return;
    setShowRestoreConfirmation(false);
    try {
        const backupData = JSON.parse(restoreData);
        if (!backupData.users || !backupData.selectedUserId) throw new Error("Invalid backup file format");
        const parsedUsers: User[] = backupData.users.map((u: any) => ({ 
            ...u, 
            profile: { ...DEFAULT_PROFILE, ...u.profile }, 
            logs: (u.logs || []).map((l: any) => ({...l, timestamp: new Date(l.timestamp)})),
            reminders: u.reminders || [],
            goals: u.goals || [],
        }));
        setUsers(parsedUsers);
        setSelectedUserId(backupData.selectedUserId);
        setDisplayTheme(backupData.displayTheme || 'auto');
        setColorTheme(backupData.colorTheme || 'indigo');
        setLanguage(backupData.language || 'fa');
        setSummaryTimeFrame(backupData.summaryTimeFrame || 'daily');
        setModalContent({ title: t('success'), message: t('restoreSuccess') });
    } catch (error) {
        console.error("Error parsing restore data:", error);
        setModalContent({ title: t('error'), message: t('restoreError') });
    } finally {
        setRestoreData(null);
    }
  };

  const cancelRestore = () => {
    setShowRestoreConfirmation(false);
    setRestoreData(null);
  }

  const handleShowDailyTip = async () => {
    if (!currentUser) return;
    const today = new Date().toISOString().slice(0, 10);
    if (dailyTip && dailyTip.date === today) {
        setModalContent({ title: t('dailyTipAndChallenge'), message: dailyTip.tip });
        return;
    }
    setModalContent({ title: t('dailyTipAndChallenge'), message: t('loading') + '...' });
    const tip = await getDailyTipWithGemini(currentUser);
    setDailyTip({ tip, date: today });
    setModalContent({ title: t('dailyTipAndChallenge'), message: tip });
  };

  const handleEnableNotifications = () => {
    if (!('Notification' in window)) {
        alert(t('notificationsNotSupported'));
    } else if (Notification.permission === 'granted') {
        new Notification(t('appName'), { body: t('notificationsEnabled') });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(t('appName'), { body: t('notificationsEnabled') });
            }
        });
    } else {
        alert(t('notificationsBlocked'));
    }
  };

  const renderContent = () => {
    if (loading) {
        return <div className="flex items-center justify-center h-full text-gray-500">{t('loading')}</div>;
    }
      
    if (!currentUser) {
        return <div className="flex items-center justify-center h-full text-gray-500">{t('preparing')}</div>;
    }
    
    let showSpecialConditionIcon = false;
    let specialConditionTooltip = '';
    if (currentUser) {
        const age = calculateAge(currentUser.profile.birthDate);
        const gender = currentUser.profile.gender;
        const isInPuberty = (gender === 'female' && age && age >= 9 && age <= 17) || (gender === 'male' && age && age >= 11 && age <= 19);
        const inLuteal = isInLutealPhase(currentUser.profile);
        showSpecialConditionIcon = isInPuberty || inLuteal;
        specialConditionTooltip = t('specialConditionActive');
    }

    const lastComparisonLog = currentUser?.logs.filter(l => l.type === 'bloodSugar' && typeof l.predictedGlucose === 'number' && l.glucose).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
    const lastComparison = lastComparisonLog ? { predicted: lastComparisonLog.predictedGlucose!, actual: parseInt(toEnglishNum(lastComparisonLog.glucose!)!, 10) } : null;

    switch (view) {
      case 'profile':
        return <ProfileScreen users={users} selectedUserId={selectedUserId!} setSelectedUserId={setSelectedUserId} updateUser={handleUpdateUser} addUser={() => handleAddUser(`${t('user')} ${users.length + 1}`)} deleteUser={handleDeleteUser} setView={handleSetView} t={t} language={language} />;
      case 'settings':
        return <SettingsScreen setView={handleSetView} displayTheme={displayTheme} setDisplayTheme={setDisplayTheme} summaryTimeFrame={summaryTimeFrame} setSummaryTimeFrame={setSummaryTimeFrame} colorTheme={colorTheme} setColorTheme={setColorTheme} onThemeClick={handleThemeClick} onBackup={handleBackup} onRestoreFileSelect={handleFileSelectForRestore} t={t} language={language} setLanguage={setLanguage} onEnableNotifications={handleEnableNotifications} isOnline={isOnline} setModalContent={setModalContent} />;
      case 'logHistory':
        return <LogHistoryScreen currentUser={currentUser} setView={handleSetView} onEditLog={handleStartEditLog} onDeleteLog={setDeletingLogId} t={t} dynamicT={dynamicT} language={language} />;
      case 'logBloodSugar':
        return <LogBloodSugarScreen onSave={handleSaveLog} setView={handleSetView} editingLog={editingLog} onDone={() => setEditingLog(null)} setModalContent={setModalContent} pendingPrediction={pendingPrediction} t={t} dynamicT={dynamicT} language={language} />;
      case 'logMeal':
        return <LogMealScreen onSave={handleSaveLog} setView={handleSetView} editingLog={editingLog} onDone={() => setEditingLog(null)} viewPayload={viewPayload} isAiEnabled={isAiEnabled} t={t} dynamicT={dynamicT} language={language} />;
      case 'logActivity':
        return <LogActivityScreen onSave={handleSaveLog} setView={handleSetView} editingLog={editingLog} onDone={() => setEditingLog(null)} currentUser={currentUser} setModalContent={setModalContent} t={t} dynamicT={dynamicT} />;
      case 'logSleep':
        return <LogSleepScreen onSave={handleSaveLog} setView={handleSetView} editingLog={editingLog} onDone={() => setEditingLog(null)} t={t} />;
      case 'logInsulin':
        return <LogInsulinScreen onSave={handleSaveLog} setView={handleSetView} editingLog={editingLog} onDone={() => setEditingLog(null)} t={t} dynamicT={dynamicT} />;
      case 'logMood':
        return <LogMoodScreen onSave={handleSaveLog} setView={handleSetView} editingLog={editingLog} onDone={() => setEditingLog(null)} t={t} />;
      case 'logMedication':
        return <LogMedicationScreen onSave={handleSaveLog} setView={handleSetView} editingLog={editingLog} onDone={() => setEditingLog(null)} t={t} />;
      case 'logPhysicalCondition':
        return <LogPhysicalConditionScreen onSave={handleSaveLog} setView={handleSetView} editingLog={editingLog} onDone={() => setEditingLog(null)} t={t} />;
      case 'aiAnalysis':
        return <AiAnalysisScreen setView={handleSetView} onAnalyzeClick={handleRunAnalysis} isAnalyzing={isAnalyzing} analysisResult={aiAnalysisResult} t={t} />;
      case 'graph':
        return <GraphScreen currentUser={currentUser} setView={handleSetView} isDarkMode={isDarkMode} t={t} dynamicT={dynamicT} language={language} />;
      case 'correctionDoseCalculator':
        return <CorrectionDoseCalculator currentUser={currentUser} setView={handleSetView} isAiEnabled={isAiEnabled} t={t} language={language} />;
      case 'tools':
        return <ToolsScreen setView={handleSetView} isAiEnabled={isAiEnabled} t={t} />;
      case 'carbTable':
        return <CarbTableScreen setView={handleSetView} t={t} />;
      case 'aiTools':
        return <AiToolsScreen setView={handleSetView} onShowDailyTip={handleShowDailyTip} t={t} />;
      case 'chatbot':
        return <ChatbotScreen setView={handleSetView} currentUser={currentUser} t={t} />;
      case 'emergency':
        return <EmergencyScreen setView={handleSetView} currentUser={currentUser} t={t} dynamicT={dynamicT} />;
      case 'goals':
        return <GoalsScreen setView={handleSetView} currentUser={currentUser} onUpdateUser={handleUpdateUser} t={t} language={language} />;
      case 'reportPreview':
        return <ComprehensiveReportGenerator currentUser={currentUser} isDarkMode={isDarkMode} t={t} dynamicT={dynamicT} setView={handleSetView} language={language} />;
      case 'diabetesIdCard':
        return <DiabetesIdCardScreen currentUser={currentUser} setView={handleSetView} t={t} language={language} />;
      case 'diabetesEncyclopedia':
        return <DiabetesEncyclopediaScreen setView={handleSetView} t={t} />;
      case 'dashboard':
      default:
        return (
          <Dashboard 
            currentUser={currentUser} 
            setView={handleSetView} 
            setModalContent={setModalContent} 
            summaryTimeFrame={summaryTimeFrame} 
            isAiEnabled={isAiEnabled} 
            isEstimating={isEstimating} 
            lastPrediction={lastPrediction} 
            lastComparison={lastComparison} 
            onEstimate={handleEstimate} 
            onStartComparison={handleStartComparison} 
            t={t} 
            language={language}
            showSpecialConditionIcon={showSpecialConditionIcon}
            specialConditionTooltip={specialConditionTooltip}
          />
        );
    }
  };
  
  const rootViews: View[] = ['dashboard', 'logHistory', 'tools', 'profile'];
  const showBottomNav = currentUser && rootViews.includes(view);

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans flex">
        <style>{`
          .no-scrollbar::-webkit-scrollbar{display:none}
          .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
          @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-down {
            animation: fade-in-down 0.2s ease-out forwards;
          }
        `}</style>
        <div className="w-full h-screen bg-white dark:bg-gray-800 flex flex-col">
          {renderContent()}
          {showBottomNav && (
            <BottomNavBar activeView={view} setView={handleSetView} onAddClick={() => setIsLogMenuOpen(true)} t={t} />
          )}
          {isLogMenuOpen && (
            <LogMenu onClose={() => setIsLogMenuOpen(false)} onSelect={(logView) => { setIsLogMenuOpen(false); setTimeout(() => handleSetView(logView), 100); }} t={t} />
          )}
        </div>
      </div>
      {modalContent && <InfoModal title={modalContent.title} message={modalContent.message} onClose={() => setModalContent(null)} language={language} />}
      {deletingLogId && (
        <ConfirmationModal message={t('deleteUserConfirm')} onConfirm={handleDeleteLogConfirm} onCancel={() => setDeletingLogId(null)} />
      )}
       {showRestoreConfirmation && (
        <ConfirmationModal message={t('restoreConfirm')} onConfirm={confirmRestore} onCancel={cancelRestore} />
      )}
    </>
  );
};

export default App;