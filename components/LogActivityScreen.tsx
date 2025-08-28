

import React, { useState, useEffect } from 'react';
import type { View, LogEntry, User, ModalContent } from '../types';
import Header from './Header';
import type { strings } from '../localization/strings';
import type dynamicStrings from '../localization/dynamicStrings';

interface LogActivityProps {
  onSave: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setView: (view: View) => void;
  editingLog: LogEntry | null;
  onDone: () => void;
  currentUser: User;
  setModalContent: (content: ModalContent) => void;
  t: (key: keyof typeof strings.fa) => string;
  dynamicT: typeof dynamicStrings.fa;
}

const getTodayJalali = () => new Date().toLocaleDateString('fa-IR-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit'});
const getCurrentTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const LogActivityScreen: React.FC<LogActivityProps> = ({ onSave, setView, editingLog, onDone, currentUser, setModalContent, t, dynamicT }) => {
  const isEditing = !!editingLog;
  
  const [activityType, setActivityType] = useState('');
  const [duration, setDuration] = useState('');
  const [jalaliDate, setJalaliDate] = useState('');
  const [time, setTime] = useState(getCurrentTime());
  
  useEffect(() => {
    if (editingLog) {
      setActivityType(editingLog.activityType || '');
      setDuration(editingLog.duration || '');
      setJalaliDate(editingLog.jalaliDate);
      setTime(editingLog.time);
    } else {
      // Reset for new entry
      setActivityType('');
      setDuration('');
      setTime(getCurrentTime());
      setJalaliDate(getTodayJalali());
    }
  }, [editingLog]);

  const handleSubmit = () => {
    if (activityType && duration && jalaliDate && time) {
      if (!isEditing) {
        const threeHoursAgo = new Date().getTime() - (3 * 60 * 60 * 1000);
        const recentBgLog = currentUser.logs
          .filter(l => l.type === 'bloodSugar' && l.glucose && l.timestamp.getTime() > threeHoursAgo)
          .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
        
        if (recentBgLog && recentBgLog.glucose) {
          const glucoseNumber = parseInt(recentBgLog.glucose, 10);
          const advice = dynamicT.getExerciseAdvice(glucoseNumber);
          if (advice) {
            const timeSince = Math.round((new Date().getTime() - recentBgLog.timestamp.getTime()) / (1000 * 60));
            const timeAgo = timeSince < 60 ? `${timeSince} minutes` : `${Math.round(timeSince/60)} hours`;
            const timeAgoFa = timeSince < 60 ? `${timeSince} دقیقه` : `${Math.round(timeSince/60)} ساعت`;
            const lastBGText = t('language') === 'fa' 
                ? `آخرین قند خون ثبت شده شما (${timeAgoFa} پیش) **${glucoseNumber} mg/dL** بوده است.\n\n`
                : `Your last recorded blood sugar (${timeAgo} ago) was **${glucoseNumber} mg/dL**.\n\n`;

            const updatedAdvice = {
                ...advice,
                message: lastBGText + advice.message
            }
            setModalContent(updatedAdvice);
          }
        }
      }

      onSave({ type: 'activity', activityType, duration, jalaliDate, time });
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
      <Header title={isEditing ? t('editActivityTitle') : t('logActivityTitle')} onBack={handleBack} />
      <div className="p-4 flex-grow overflow-y-auto no-scrollbar">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
          <div className="space-y-4">
            <div>
              <label htmlFor="activityType" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('activityType')}</label>
              <input id="activityType" type="text" value={activityType} onChange={(e) => setActivityType(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>
            <div>
              <label htmlFor="duration" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('durationMinutes')}</label>
              <input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
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

export default LogActivityScreen;