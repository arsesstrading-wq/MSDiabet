
import React, { useState, useEffect } from 'react';
import type { View, LogEntry } from '../types';
import Header from './Header';
import type { strings } from '../localization/strings';

interface LogMedicationProps {
  onSave: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setView: (view: View) => void;
  editingLog: LogEntry | null;
  onDone: () => void;
  t: (key: keyof typeof strings.fa) => string;
}

const getTodayJalali = () => new Date().toLocaleDateString('fa-IR-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit'});
const getCurrentTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const LogMedicationScreen: React.FC<LogMedicationProps> = ({ onSave, setView, editingLog, onDone, t }) => {
  const isEditing = !!editingLog;
  
  const [medicationName, setMedicationName] = useState('');
  const [medicationDose, setMedicationDose] = useState('');
  const [medicationUnit, setMedicationUnit] = useState('');
  const [jalaliDate, setJalaliDate] = useState('');
  const [time, setTime] = useState(getCurrentTime());

  useEffect(() => {
    if (editingLog && editingLog.type === 'medication') {
      setMedicationName(editingLog.medicationName || '');
      setMedicationDose(editingLog.medicationDose || '');
      setMedicationUnit(editingLog.medicationUnit || '');
      setJalaliDate(editingLog.jalaliDate);
      setTime(editingLog.time);
    } else {
      setMedicationName('');
      setMedicationDose('');
      setMedicationUnit('');
      setTime(getCurrentTime());
      setJalaliDate(getTodayJalali());
    }
  }, [editingLog]);

  const handleSubmit = () => {
    if (medicationName && medicationDose && jalaliDate && time) {
      onSave({ type: 'medication', medicationName, medicationDose, medicationUnit, jalaliDate, time });
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
      <Header title={isEditing ? t('editMedicationTitle') : t('logMedicationTitle')} onBack={handleBack} />
      <div className="p-4 flex-grow overflow-y-auto no-scrollbar">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
          <div className="space-y-4">
             <div>
              <label htmlFor="medicationName" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('medicationName')}</label>
              <input id="medicationName" type="text" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="medicationDose" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('medicationDose')}</label>
                    <input id="medicationDose" type="text" value={medicationDose} onChange={(e) => setMedicationDose(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                    <label htmlFor="medicationUnit" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('medicationUnit')}</label>
                    <input id="medicationUnit" type="text" value={medicationUnit} onChange={(e) => setMedicationUnit(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder={`${t('example')}: mg, قرص, ...`} />
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

export default LogMedicationScreen;