



import React, { useState, useEffect } from 'react';
import type { View, LogEntry } from '../types';
import Header from './Header';
import type { strings } from '../localization/strings';

interface LogMoodProps {
  onSave: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setView: (view: View) => void;
  editingLog: LogEntry | null;
  onDone: () => void;
  t: (key: keyof typeof strings.fa) => string;
}

const getTodayJalali = () => new Date().toLocaleDateString('fa-IR-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit'});
const getCurrentTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const LogMoodScreen: React.FC<LogMoodProps> = ({ onSave, setView, editingLog, onDone, t }) => {
  const isEditing = !!editingLog;
  
  const [moods, setMoods] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [jalaliDate, setJalaliDate] = useState('');
  const [time, setTime] = useState(getCurrentTime());
  
  const moodOptionKeys: (keyof typeof strings.fa)[] = [
    'moodHappy', 'moodCalm', 'moodSad', 'moodStressed', 'moodAnxious',
    'moodScared', 'moodAngry', 'moodCrying'
  ];
  const MOOD_OPTIONS = moodOptionKeys.map(key => ({ key, label: t(key) }));

  useEffect(() => {
    if (editingLog) {
      const initialMoods = editingLog.mood || [];
      setMoods(Array.isArray(initialMoods) ? initialMoods : [initialMoods]);
      setDescription(editingLog.description || '');
      setJalaliDate(editingLog.jalaliDate);
      setTime(editingLog.time);
    } else {
      // Reset for new entry
      setMoods([]);
      setDescription('');
      setTime(getCurrentTime());
      setJalaliDate(getTodayJalali());
    }
  }, [editingLog]);

  const handleMoodToggle = (moodLabel: string) => {
    setMoods(prev => 
      prev.includes(moodLabel) 
        ? prev.filter(m => m !== moodLabel) 
        : [...prev, moodLabel]
    );
  };

  const handleSubmit = () => {
    if (moods.length > 0 && jalaliDate && time) {
      onSave({ type: 'mood', mood: moods, description, jalaliDate, time });
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
      <Header title={isEditing ? t('editMoodTitle') : t('logMoodTitle')} onBack={handleBack} />
      <div className="p-4 flex-grow overflow-y-auto no-scrollbar">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t('howAreYouFeeling')}</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {MOOD_OPTIONS.map(({ key, label }) => (
                      <button
                          key={key}
                          onClick={() => handleMoodToggle(label)}
                          className={`w-full text-center py-3 px-2 rounded-lg transition-all duration-200 font-semibold text-sm shadow-sm border-2 ${
                              moods.includes(label)
                              ? 'bg-primary-600 text-white border-primary-600 scale-105'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                          {label}
                      </button>
                  ))}
              </div>
            </div>
            <div>
              <label htmlFor="description" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('description')} ({t('optional')})</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3} placeholder="..." />
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

export default LogMoodScreen;