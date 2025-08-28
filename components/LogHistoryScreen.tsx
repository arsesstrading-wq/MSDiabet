



import React from 'react';
import type { User, View, LogEntry, MealType, InjectionSite, Language } from '../types';
import Header from './Header';
import { EditIcon, DeleteIcon } from './Icons';
import { getGlucoseColorClass } from '../constants';
import type { strings } from '../localization/strings';
import type dynamicStrings from '../localization/dynamicStrings';
import { toPersianNum } from '../utils';

interface LogHistoryProps {
  currentUser: User;
  setView: (view: View) => void;
  onEditLog: (log: LogEntry) => void;
  onDeleteLog: (logId: string) => void;
  t: (key: keyof typeof strings.fa) => string;
  dynamicT: typeof dynamicStrings.fa;
  language: Language;
}

const LogHistoryScreen: React.FC<LogHistoryProps> = ({ currentUser, setView, onEditLog, onDeleteLog, t, dynamicT, language }) => {
  const sortedLogs = currentUser.logs.slice().sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header title={t('appName')} onBack={() => setView('dashboard')} />
      <div className="p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto no-scrollbar">
        <div className="w-full">
          {sortedLogs.length > 0 ? (
            <ul className="space-y-4">
              {sortedLogs.map(log => (
                <li key={log.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start">
                      <div className="flex-grow">
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-semibold">{t('date')}: </span>{toPersianNum(log.jalaliDate, language)} - <span className="font-semibold mr-1">{t('time')}: </span>{toPersianNum(log.time, language)}
                          </p>
                          {log.type === 'bloodSugar' && <p className="font-semibold text-lg mt-1">{t('logMenuBloodSugar')}: <span className={getGlucoseColorClass(log.glucose)}>{toPersianNum(log.glucose, language)}</span> mg/dL</p>}
                          {log.type === 'meal' && (
                          <div>
                              <p className="font-semibold text-lg mt-1">{dynamicT.getMealTypeName(log.mealType)}: {toPersianNum(log.carbs, language)} {t('gram')}</p>
                              {log.insulinDose && <p className="text-sm text-gray-600 dark:text-gray-400">{t('logMenuInsulin')}: {toPersianNum(log.insulinDose, language)} {t('unit')}{log.injectionSite ? ` in ${dynamicT.getInjectionSiteName(log.injectionSite)}` : ''}</p>}
                              {log.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{log.description}"</p>}
                          </div>
                          )}
                          {log.type === 'activity' && <p className="font-semibold text-lg mt-1">{t('logMenuActivity')}: {log.activityType} ({toPersianNum(log.duration, language)} {t('minute')})</p>}
                          {log.type === 'sleep' && <p className="font-semibold text-lg mt-1">{t('logMenuSleep')}: from {toPersianNum(log.sleepTime, language)} to {toPersianNum(log.time, language)}</p>}
                          {log.type === 'insulin' && <p className="font-semibold text-lg mt-1">{t('insulinType')} {log.insulinType === 'basal' ? '(Basal)' : '(Bolus)'}: {toPersianNum(log.insulinDose, language)} {t('unit')}{log.injectionSite ? ` in ${dynamicT.getInjectionSiteName(log.injectionSite)}` : ''}</p>}
                          {log.type === 'medication' && (
                            <div>
                                <p className="font-semibold text-lg mt-1">{t('logMenuMedication')}: {log.medicationName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('medicationDose')}: {toPersianNum(log.medicationDose, language)} {log.medicationUnit}</p>
                            </div>
                          )}
                          {log.type === 'mood' && (
                            <div>
                                <p className="font-semibold text-lg mt-1">{t('logMenuMood')}: {Array.isArray(log.mood) ? log.mood.join('، ') : log.mood}</p>
                                {log.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{log.description}"</p>}
                            </div>
                          )}
                           {log.type === 'physicalCondition' && (
                            <div>
                                <p className="font-semibold text-lg mt-1">{t('physicalCondition')}: {Array.isArray(log.condition) ? log.condition.join('، ') : log.condition}</p>
                                {log.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">"{log.description}"</p>}
                            </div>
                          )}
                      </div>
                      <div className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0">
                          <button onClick={() => onEditLog(log)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200">
                              <EditIcon />
                          </button>
                          <button onClick={() => onDeleteLog(log.id)} className="p-2 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors duration-200">
                              <DeleteIcon />
                          </button>
                      </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">{t('noDataYet')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogHistoryScreen;
