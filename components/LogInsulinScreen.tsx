

import React, { useState, useEffect } from 'react';
import type { View, LogEntry, InjectionSite } from '../types';
import Header from './Header';
import type { strings } from '../localization/strings';
import type dynamicStrings from '../localization/dynamicStrings';

interface LogInsulinProps {
  onSave: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setView: (view: View) => void;
  editingLog: LogEntry | null;
  onDone: () => void;
  t: (key: keyof typeof strings.fa) => string;
  dynamicT: typeof dynamicStrings.fa;
}

const getTodayJalali = () => new Date().toLocaleDateString('fa-IR-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit'});
const getCurrentTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const LogInsulinScreen: React.FC<LogInsulinProps> = ({ onSave, setView, editingLog, onDone, t, dynamicT }) => {
  const isEditing = !!editingLog;
  
  const [insulinType, setInsulinType] = useState<'basal' | 'bolus'>('bolus');
  const [insulinDose, setInsulinDose] = useState('');
  const [injectionSite, setInjectionSite] = useState<InjectionSite>('abdomen');
  const [jalaliDate, setJalaliDate] = useState('');
  const [time, setTime] = useState(getCurrentTime());

  const siteNames = (['abdomen', 'arm', 'leg', 'buttocks'] as InjectionSite[]).reduce((acc, site) => {
    acc[site] = dynamicT.getInjectionSiteName(site);
    return acc;
  }, {} as Record<InjectionSite, string>);

  useEffect(() => {
    if (editingLog && editingLog.type === 'insulin') {
      setInsulinType(editingLog.insulinType || 'bolus');
      setInsulinDose(editingLog.insulinDose || '');
      setJalaliDate(editingLog.jalaliDate);
      setTime(editingLog.time);
      setInjectionSite(editingLog.injectionSite || 'abdomen');
    } else {
      // Reset for new entry
      setInsulinType('bolus');
      setInsulinDose('');
      setTime(getCurrentTime());
      setJalaliDate(getTodayJalali());
      setInjectionSite('abdomen');
    }
  }, [editingLog]);

  const handleSubmit = () => {
    if (insulinDose && jalaliDate && time) {
      onSave({ type: 'insulin', insulinDose, insulinType, injectionSite, jalaliDate, time });
      onDone();
      requestAnimationFrame(() => {
        setView(isEditing ? 'logHistory' : 'dashboard');
      });
    } else {
        alert(t('requiredFields'));
    }
  };

  const handleBack = () => {
    onDone();
    requestAnimationFrame(() => {
      setView(isEditing ? 'logHistory' : 'dashboard');
    });
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header title={isEditing ? t('editInsulinTitle') : t('logInsulinTitle')} onBack={handleBack} />
      <div className="p-4 flex-grow overflow-y-auto no-scrollbar">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
          <div className="space-y-4">
            <div>
              <label htmlFor="insulinType" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('insulinType')}</label>
              <select 
                id="insulinType" 
                value={insulinType} 
                onChange={(e) => setInsulinType(e.target.value as 'basal' | 'bolus')} 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="bolus">Bolus</option>
                <option value="basal">Basal</option>
              </select>
            </div>
             <div>
              <label htmlFor="insulinDose" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('insulinDoseUnits')}</label>
              <input id="insulinDose" type="number" value={insulinDose} onChange={(e) => setInsulinDose(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
             <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t('injectionSite')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['abdomen', 'arm', 'leg', 'buttocks'] as InjectionSite[]).map((site) => (
                    <button
                        key={site}
                        type="button"
                        onClick={() => setInjectionSite(site)}
                        className={`w-full text-center py-2 px-2 rounded-lg transition-colors duration-200 font-semibold text-sm ${
                        injectionSite === site
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                    >
                        {siteNames[site]}
                    </button>
                    ))}
                </div>
            </div>
            <div>
              <label htmlFor="date" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('date')}</label>
              <input
                  id="date"
                  type="text"
                  value={jalaliDate}
                  onChange={(e) => setJalaliDate(e.target.value)}
                  placeholder={`${t('example')}: ۱۴۰۳/۰۵/۰۳`}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
               />
            </div>
            <div>
              <label htmlFor="time" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('time')}</label>
              <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-inner">
        <div className="w-full">
          <button onClick={handleSubmit} className="w-full bg-primary-600 text-white p-3 rounded-lg shadow-md hover:bg-primary-700 transition-all duration-200 font-semibold">
            {isEditing ? t('saveChanges') : t('submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogInsulinScreen;