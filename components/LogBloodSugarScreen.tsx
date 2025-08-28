


import React, { useState, useEffect } from 'react';
import type { View, LogEntry, ModalContent, Language } from '../types';
import Header from './Header';
import type { strings } from '../localization/strings';
import type dynamicStrings from '../localization/dynamicStrings';
import { toPersianNum } from '../utils';

interface LogBloodSugarProps {
  onSave: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setView: (view: View) => void;
  editingLog: LogEntry | null;
  onDone: () => void;
  setModalContent: (content: ModalContent) => void;
  pendingPrediction: number | null;
  t: (key: keyof typeof strings.fa) => string;
  dynamicT: typeof dynamicStrings.fa;
  language: Language;
}

const getTodayJalali = () => new Date().toLocaleDateString('fa-IR-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit'});
const getCurrentTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const LogBloodSugarScreen: React.FC<LogBloodSugarProps> = ({ onSave, setView, editingLog, onDone, setModalContent, pendingPrediction, t, dynamicT, language }) => {
  const isEditing = !!editingLog;
  
  const [glucose, setGlucose] = useState('');
  const [jalaliDate, setJalaliDate] = useState('');
  const [time, setTime] = useState(getCurrentTime());

  useEffect(() => {
    if (editingLog) {
      setGlucose(editingLog.glucose || '');
      setTime(editingLog.time);
      setJalaliDate(editingLog.jalaliDate);
    } else {
      // Reset for new log entry
      setGlucose('');
      setTime(getCurrentTime());
      setJalaliDate(getTodayJalali());
    }
  }, [editingLog]);

  const handleSubmit = () => {
    if (glucose && jalaliDate && time) {
      onSave({ type: 'bloodSugar', glucose, jalaliDate, time });
      onDone();

      if (!isEditing) {
        const glucoseNumber = parseInt(glucose, 10);
        if (!isNaN(glucoseNumber)) {
          if (glucoseNumber < 80) {
            setModalContent(dynamicT.getHypoAlert(glucoseNumber));
          } else {
            const exerciseAdvice = dynamicT.getExerciseAdvice(glucoseNumber);
            if (exerciseAdvice) {
              setModalContent(exerciseAdvice);
            }
          }
        }
      }
      
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
      <Header title={isEditing ? t('editBloodSugarTitle') : t('logBloodSugarTitle')} onBack={handleBack} />
      <div className="p-4 flex-grow overflow-y-auto no-scrollbar">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
          {pendingPrediction !== null && (
            <div className="bg-primary-50 dark:bg-primary-900/40 p-3 rounded-lg text-center mb-4 border border-primary-500">
              <p className="font-semibold text-primary-700 dark:text-primary-300">
                  {t('estimatedValue')}: ~{toPersianNum(pendingPrediction, language)} mg/dL
              </p>
              <p className="text-sm text-primary-600 dark:text-primary-400">
                  {t('enterRealValue')}
              </p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="glucose" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('bloodSugarLevel')}</label>
              <input id="glucose" type="number" value={glucose} onChange={(e) => setGlucose(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label htmlFor="date" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('date')}</label>
              <input
                  id="date"
                  type="text"
                  value={jalaliDate}
                  onChange={(e) => setJalaliDate(e.target.value)}
                  placeholder={`${t('example')}: ۱۴۰۳/۰۵/۰۳`}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
               />
            </div>
            <div>
              <label htmlFor="time" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('time')}</label>
              <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-inner">
        <div className="w-full">
          <button onClick={handleSubmit} className="w-full bg-indigo-600 text-white p-3 rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 font-semibold">
            {isEditing ? t('saveChanges') : t('submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogBloodSugarScreen;
