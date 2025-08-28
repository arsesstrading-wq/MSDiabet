

import React, { useState } from 'react';
import type { View, User, Goal, Language } from '../types';
import Header from './Header';
import { TrophyIcon, PlusIcon, TargetIcon, FootprintsIcon } from './Icons';
import type { strings } from '../localization/strings';
import { toPersianNum, toEnglishNum } from '../utils';

interface GoalsScreenProps {
  setView: (view: View) => void;
  currentUser: User;
  onUpdateUser: (user: User) => void;
  t: (key: keyof typeof strings.fa) => string;
  language: Language;
}

const GoalsScreen: React.FC<GoalsScreenProps> = ({ setView, currentUser, onUpdateUser, t, language }) => {
  const [isAdding, setIsAdding] = useState(false);

  const activeGoals = currentUser.goals.filter(g => g.status === 'active');
  const completedGoals = currentUser.goals.filter(g => g.status === 'completed');

  const calculateProgress = (goal: Goal): { progress: number; current: string } => {
    const timeLimit = goal.timeFrame === 'weekly' ? 7 : 30;
    const startDate = new Date(goal.startDate);
    const limitDate = new Date(startDate.getTime());
    limitDate.setDate(limitDate.getDate() + timeLimit);
    
    const relevantLogs = currentUser.logs.filter(log => new Date(log.timestamp) >= startDate && new Date(log.timestamp) <= limitDate);

    if (goal.type === 'avg_glucose') {
      const bgLogs = relevantLogs.filter(l => l.type === 'bloodSugar' && l.glucose);
      if (bgLogs.length === 0) return { progress: 0, current: 'N/A' };
      const avg = bgLogs.reduce((sum, log) => sum + parseInt(toEnglishNum(log.glucose!), 10), 0) / bgLogs.length;
      const progress = avg <= goal.targetValue ? 100 : (goal.targetValue / avg) * 50;
      return { progress: Math.min(100, progress), current: `${toPersianNum(avg.toFixed(0), language)} mg/dL` };
    }

    if (goal.type === 'daily_activity') {
      const activityMinutes = relevantLogs
        .filter(l => l.type === 'activity' && l.duration)
        .reduce((sum, log) => sum + parseInt(toEnglishNum(log.duration!), 10), 0);
      const progress = (activityMinutes / (goal.targetValue * timeLimit)) * 100;
      return { progress: Math.min(100, progress), current: `${toPersianNum(activityMinutes, language)} / ${toPersianNum(goal.targetValue * timeLimit, language)} min` };
    }

    return { progress: 0, current: 'N/A' };
  };
  
  const addGoal = (type: Goal['type'], targetValue: number, timeFrame: Goal['timeFrame']) => {
      const newGoal: Goal = {
          id: `goal_${Date.now()}`,
          type,
          targetValue,
          timeFrame,
          status: 'active',
          startDate: new Date().toISOString()
      };
      const updatedUser = { ...currentUser, goals: [...currentUser.goals, newGoal] };
      onUpdateUser(updatedUser);
      setIsAdding(false);
  };
  
  const abandonGoal = (id: string) => {
      const updatedGoals = currentUser.goals.filter(g => g.id !== id);
      onUpdateUser({ ...currentUser, goals: updatedGoals });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header title={t('goalsAndAchievements')} onBack={() => setView('tools')} />
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold mb-3">{t('activeGoals')}</h2>
          {activeGoals.length > 0 ? (
            <div className="space-y-3">
              {activeGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} progress={calculateProgress(goal)} onAbandon={abandonGoal} t={t} language={language} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t('noActiveGoals')}</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-3">{t('completedGoals')}</h2>
          {completedGoals.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {completedGoals.map(goal => (
                <div key={goal.id} className="text-center p-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <TrophyIcon className="h-10 w-10 mx-auto text-yellow-500"/>
                    <p className="text-xs mt-1 font-semibold">{t(`goalType_${goal.type}`)}</p>
                    <p className="text-[10px] text-gray-500">{new Date(goal.startDate).toLocaleDateString('fa-IR')}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t('noCompletedGoals')}</p>
          )}
        </div>
      </div>
      {!isAdding && (
         <div className="fixed bottom-24 ltr:right-6 rtl:left-6 z-20">
            <button onClick={() => setIsAdding(true)} className="bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700">
                <PlusIcon />
            </button>
        </div>
      )}
      {isAdding && <AddGoalModal onAdd={addGoal} onClose={() => setIsAdding(false)} t={t} />}
    </div>
  );
};

const GoalCard = ({ goal, progress, onAbandon, t, language }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg shadow-sm">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-primary-600 dark:text-primary-400">{t(`goalType_${goal.type}`)}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{t('target')}: {toPersianNum(goal.targetValue, language)} {t(`goalUnit_${goal.type}`)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('current')}: {progress.current}</p>
            </div>
            <button onClick={() => onAbandon(goal.id)} className="text-xs text-red-500">{t('abandonGoal')}</button>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2">
            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress.progress}%` }}></div>
        </div>
    </div>
);

const AddGoalModal = ({ onAdd, onClose, t }) => {
    const [type, setType] = useState<Goal['type']>('avg_glucose');
    const [target, setTarget] = useState('140');
    const [timeFrame, setTimeFrame] = useState<Goal['timeFrame']>('weekly');
    
    const handleSubmit = () => {
        const targetValue = parseInt(target, 10);
        if (isNaN(targetValue) || targetValue <= 0) {
            alert(t('invalidTarget'));
            return;
        }
        onAdd(type, targetValue, timeFrame);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4">{t('addNewGoal')}</h3>
                {/* Simplified form */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">{t('goalType')}</label>
                        <select value={type} onChange={e => setType(e.target.value as Goal['type'])} className="w-full p-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            <option value="avg_glucose">{t('goalType_avg_glucose')}</option>
                            <option value="daily_activity">{t('goalType_daily_activity')}</option>
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">{t('targetValue')}</label>
                        <input type="number" value={target} onChange={e => setTarget(e.target.value)} className="w-full p-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <div>
                        <label className="text-sm font-medium">{t('timeFrame')}</label>
                        <select value={timeFrame} onChange={e => setTimeFrame(e.target.value as Goal['timeFrame'])} className="w-full p-2 mt-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            <option value="weekly">{t('weekly')}</option>
                            <option value="monthly">{t('monthly')}</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg">{t('cancel')}</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-lg">{t('addGoal')}</button>
                </div>
            </div>
        </div>
    );
};

export default GoalsScreen;
