

import React, { useState, useEffect } from 'react';
import type { View, LogEntry } from '../types';
import Header from './Header';
import type { strings } from '../localization/strings';

interface LogSleepProps {
  onSave: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setView: (view: View) => void;
  editingLog: LogEntry | null;
  onDone: () => void;
  t: (key: keyof typeof strings.fa) => string;
}

const getTodayJalali = () => new Date().toLocaleDateString('fa-IR-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit'});
const getCurrentTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const LogSleepScreen: React.FC<LogSleepProps> = ({ onSave, setView, editingLog, onDone, t }) => {
  const isEditing = !!editingLog;
  
  const [jalaliDate, setJalaliDate] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [wakeTime, setWakeTime] = useState(getCurrentTime());

  useEffect(() => {
    if (editingLog) {
      setJalaliDate(editingLog.jalaliDate);
      setSleepTime(editingLog.sleepTime || '');
      setWakeTime(editingLog.time); // wakeTime is stored in 'time'
    } else {
      // Reset for new log entry
      setJalaliDate(getTodayJalali());
      setSleepTime('');
      setWakeTime(getCurrentTime());
    }
  }, [editingLog]);

  const handleSubmit = () => {
    if (jalaliDate && sleepTime && wakeTime) {
      // time property stores the wakeTime
      onSave({ type: 'sleep', jalaliDate, time: wakeTime, sleepTime });
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
      <Header title={isEditing ? t('editSleepTitle') : t('logSleepTitle')} onBack={handleBack} />
      <div className="p-4 flex-grow overflow-y-auto no-scrollbar">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
          <div className="space-y-4">
            <div>
              <label htmlFor="date" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('wakeUpDate')}</label>
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
              <label htmlFor="sleepTime" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('sleepTime')}</label>
              <input id="sleepTime" type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label htmlFor="wakeTime" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('wakeTime')}</label>
              <input id="wakeTime" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
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

export default LogSleepScreen;