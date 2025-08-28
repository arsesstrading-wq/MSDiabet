

import React from 'react';
import type { User, View, ModalContent, SummaryTimeFrame, Language } from '../types';
import {
  BloodDropIcon, MealIcon, ActivityIcon, GraphIcon, CorrectionDoseIcon,
  TargetIcon, SyringeIcon, WheatIcon, FootprintsIcon,
  MoonIcon, SunIcon, HistoryIcon, ProfileIconGeneric, ClockIcon
} from './Icons';
import { getGlucoseColorClass, calculateInsulinFactors, calculateIOB } from '../constants';
import { GlucosePredictionCard } from './GlucosePredictionCard';
import type { strings } from '../localization/strings';
import { toPersianNum, toEnglishNum } from '../utils';

// Card for top stats (ICR, ISF, BMI)
const StatCard: React.FC<{ label: string; value: string; onClick: () => void }> = ({ label, value, onClick }) => (
  <div onClick={onClick} className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all duration-200 flex items-center justify-between h-full">
    <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">{label}</p>
    <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
  </div>
);

// Card for summary stats (Today's summary)
const SummaryStatCard: React.FC<{ label: string; value: React.ReactNode; unit: string; icon: React.ReactNode; onClick?: () => void }> = ({ label, value, unit, icon, onClick }) => (
    <div onClick={onClick} className={`bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-between h-full transition-all duration-200 ${onClick ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/60' : ''}`}>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="flex-shrink-0 p-2 bg-primary-50 dark:bg-primary-900/40 rounded-full text-primary-600 dark:text-primary-400">
                {icon}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold truncate">{label}</p>
        </div>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{unit}</span></p>
    </div>
);

interface DashboardProps {
  currentUser: User;
  setView: (view: View) => void;
  setModalContent: (content: ModalContent | null) => void;
  summaryTimeFrame: SummaryTimeFrame;
  isAiEnabled: boolean;
  isEstimating: boolean;
  lastPrediction: { value: number; timestamp: Date } | null;
  lastComparison: { predicted: number; actual: number } | null;
  onEstimate: () => void;
  onStartComparison: (predictedValue: number) => void;
  t: (key: keyof typeof strings.fa) => string;
  language: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ currentUser, setView, setModalContent, summaryTimeFrame, isAiEnabled, isEstimating, lastPrediction, lastComparison, onEstimate, onStartComparison, t, language }) => {
  
  // For Summary - uses the selected time frame
  const getStartDate = (timeFrame: SummaryTimeFrame): Date => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Midnight today
    switch (timeFrame) {
        case 'weekly':
            const dayOfWeek = now.getDay(); // Sunday=0, ..., Saturday=6
            const diff = (dayOfWeek + 1) % 7; // days to subtract to get to last Saturday
            const startOfWeek = new Date(today.getTime());
            startOfWeek.setDate(today.getDate() - diff);
            return startOfWeek;
        case 'monthly':
            return new Date(now.getFullYear(), now.getMonth(), 1);
        case 'quarterly':
            const quarter = Math.floor(now.getMonth() / 3);
            return new Date(now.getFullYear(), quarter * 3, 1);
        case 'daily':
        default:
            return today;
    }
  };

  const startDate = getStartDate(summaryTimeFrame);
  const periodLogs = currentUser.logs.filter(log => log.timestamp >= startDate);

  const periodBloodSugarLogs = periodLogs.filter(l => l.type === 'bloodSugar' && l.glucose);
  const avgBloodSugar = periodBloodSugarLogs.length > 0
    ? (periodBloodSugarLogs.reduce((sum, log) => sum + parseInt(toEnglishNum(log.glucose!)), 0) / periodBloodSugarLogs.length).toFixed(0)
    : '—';
  
  const periodMealLogs = periodLogs.filter(l => l.type === 'meal');
  const totalCarbs = periodMealLogs.reduce((sum, log) => sum + (parseInt(toEnglishNum(log.carbs) || '0', 10)), 0);
  
  const periodInsulinLogs = periodLogs.filter(l => (l.type === 'meal' && l.insulinDose) || l.type === 'insulin');
  const totalInsulin = periodInsulinLogs.reduce((sum, log) => sum + (parseFloat(toEnglishNum(log.insulinDose) || '0')), 0);

  const periodActivityLogs = periodLogs.filter(l => l.type === 'activity');
  const totalActivity = periodActivityLogs.reduce((sum, log) => sum + parseInt(toEnglishNum(log.duration) || '0', 10), 0);
  
  const insulinFactors = calculateInsulinFactors(currentUser);
  const totalDailyInsulin = insulinFactors.tdd;
  const weight = parseFloat(toEnglishNum(currentUser.profile.weight));
  const height = parseFloat(toEnglishNum(currentUser.profile.height));

  const icrString = toPersianNum(insulinFactors.icr > 0 ? insulinFactors.icr.toFixed(1) : '—', language);
  const isfString = toPersianNum(insulinFactors.isf > 0 ? insulinFactors.isf.toFixed(1) : '—', language);
  const ff = insulinFactors.icr > 0 ? (15 / insulinFactors.icr).toFixed(1) : '—';
  const ffString = toPersianNum(ff, language);

  let bmi = '—';
  if (weight && height) {
    const heightInMeters = height / 100;
    bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  const bmiString = toPersianNum(bmi, language);
  
  // A1C Calculation
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const a1cBloodSugarLogs = currentUser.logs.filter(
    l => l.type === 'bloodSugar' && l.glucose && l.timestamp >= ninetyDaysAgo
  );

  let estimatedA1C = '—';
  if (a1cBloodSugarLogs.length > 0) {
    const avgBloodSugarA1c = a1cBloodSugarLogs.reduce((sum, log) => sum + parseInt(toEnglishNum(log.glucose!)), 0) / a1cBloodSugarLogs.length;
    const a1cValue = (avgBloodSugarA1c + 46.7) / 28.7;
    estimatedA1C = a1cValue.toFixed(1);
  }
  const estimatedA1CString = toPersianNum(estimatedA1C, language);

  const handleCardClick = (type: 'isf' | 'icr' | 'bmi' | 'ff' | 'a1c' | 'tdd') => {
    switch (type) {
      case 'isf': {
        let isfMessage = t('modal_noDataSourceMessage');
        if (isfString !== '—') {
          const key = `modal_isfMessage_${insulinFactors.source}`;
          isfMessage = t(key as keyof typeof strings.fa).replace('{isfString}', isfString);
        }
        setModalContent({ title: t('modal_isfTitle'), message: isfMessage });
        break;
      }
      case 'icr': {
        let icrMessage = t('modal_noDataSourceMessage');
        if (icrString !== '—') {
          const key = `modal_icrMessage_${insulinFactors.source}`;
          icrMessage = t(key as keyof typeof strings.fa).replace('{icrString}', icrString);
        }
        setModalContent({ title: t('modal_icrTitle'), message: icrMessage });
        break;
      }
      case 'bmi': {
        let message = t('modal_bmiDescNoValue');
        if (bmiString !== '—') {
          const bmiNum = parseFloat(bmi);
          let rangeKey: keyof typeof strings.fa;
          if (bmiNum < 18.5) rangeKey = 'modal_bmiRangeUnderweight';
          else if (bmiNum < 25) rangeKey = 'modal_bmiRangeNormal';
          else if (bmiNum < 30) rangeKey = 'modal_bmiRangeOverweight';
          else rangeKey = 'modal_bmiRangeObese';
          message = t('modal_bmiDescWithValue').replace('{bmi}', bmiString).replace('{range}', t(rangeKey));
        }
        setModalContent({ title: t('modal_bmiTitle'), message });
        break;
      }
      case 'ff': {
        let ffMessage = t('modal_noDataSourceMessage');
        if (ffString !== '—') {
          ffMessage = t('modal_ffMessage').replace('{ff}', ffString);
        }
        setModalContent({ title: t('modal_ffTitle'), message: ffMessage });
        break;
      }
      case 'a1c': {
        let a1cMessage = t('modal_a1cDescNoValue');
        if (estimatedA1CString !== '—' && a1cBloodSugarLogs.length > 0) {
          const avgBloodSugarA1c = a1cBloodSugarLogs.reduce((sum, log) => sum + parseInt(toEnglishNum(log.glucose!)), 0) / a1cBloodSugarLogs.length;
          a1cMessage = t('modal_a1cDescWithValue')
            .replace('{a1cValue}', estimatedA1CString)
            .replace('{avgBloodSugar}', toPersianNum(avgBloodSugarA1c.toFixed(0), language));
        }
        setModalContent({ title: t('modal_a1cTitle'), message: a1cMessage });
        break;
      }
      case 'tdd': {
        let tddMessage = t('modal_noDataSourceMessage');
        if (insulinFactors.tdd > 0) {
          const key = `modal_tddMessage_${insulinFactors.source}`;
          tddMessage = t(key as keyof typeof strings.fa).replace('{tdd}', toPersianNum(insulinFactors.tdd.toFixed(1), language));
        }
        setModalContent({ title: t('modal_tddTitle'), message: tddMessage });
        break;
      }
    }
  };

  const calculateInsulinEstimates = (): {
    basal: { value: number; source: 'logs' | 'tdd' | 'none' };
    bolus: { value: number; source: 'logs' | 'tdd' | 'none' };
  } => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentLogs = currentUser.logs.filter(log => log.timestamp >= fourteenDaysAgo);

    const recentBasalLogs = recentLogs.filter(log => log.type === 'insulin' && log.insulinType === 'basal' && log.insulinDose);
    const recentBolusLogs = recentLogs.filter(log => 
        (log.type === 'insulin' && log.insulinType === 'bolus' && log.insulinDose) || 
        (log.type === 'meal' && log.insulinDose)
    );

    let basal = { value: 0, source: 'none' as 'logs' | 'tdd' | 'none' };
    let bolus = { value: 0, source: 'none' as 'logs' | 'tdd' | 'none' };

    // Basal from logs
    if (recentBasalLogs.length > 0) {
        const dailyTotals = new Map<string, number>();
        recentBasalLogs.forEach(log => {
            const dose = parseFloat(toEnglishNum(log.insulinDose) || '0');
            if (dose > 0) {
                const day = log.jalaliDate;
                dailyTotals.set(day, (dailyTotals.get(day) || 0) + dose);
            }
        });
        if (dailyTotals.size > 0) {
            const total = Array.from(dailyTotals.values()).reduce((sum, dailyDose) => sum + dailyDose, 0);
            basal = { value: total / dailyTotals.size, source: 'logs' };
        }
    }

    // Bolus from logs
    if (recentBolusLogs.length > 0) {
        const dailyTotals = new Map<string, number>();
        recentBolusLogs.forEach(log => {
            const dose = parseFloat(toEnglishNum(log.insulinDose) || '0');
            if (dose > 0) {
                const day = log.jalaliDate;
                dailyTotals.set(day, (dailyTotals.get(day) || 0) + dose);
            }
        });
        if (dailyTotals.size > 0) {
            const total = Array.from(dailyTotals.values()).reduce((sum, dailyDose) => sum + dailyDose, 0);
            bolus = { value: total / dailyTotals.size, source: 'logs' };
        }
    }

    if (totalDailyInsulin > 0) {
        if (basal.value === 0) {
            basal = { value: totalDailyInsulin * 0.5, source: 'tdd' };
        }
        if (bolus.value === 0) {
            bolus = { value: totalDailyInsulin * 0.5, source: 'tdd' };
        }
    }
    
    return { basal, bolus };
  };

  const { basal, bolus } = calculateInsulinEstimates();
  const iob = calculateIOB(currentUser);

  const handleInsulinCardClick = (type: 'basal' | 'bolus') => {
    const { basal: basalData, bolus: bolusData } = calculateInsulinEstimates();
    const data = type === 'basal' ? basalData : bolusData;
    const value = data.value > 0 ? toPersianNum(data.value.toFixed(1), language) : '—';

    let title = t(type === 'basal' ? 'modal_basalTitle' : 'modal_bolusTitle');
    let message = '';
    
    if (data.source === 'none') {
        message = t(type === 'basal' ? 'modal_basalDescNoValue' : 'modal_bolusDescNoValue');
    } else if (data.source === 'logs') {
        const key = type === 'basal' ? 'modal_basalMessage_logs' : 'modal_bolusMessage_logs';
        message = t(key as keyof typeof strings.fa).replace('{value}', value);
    } else { // tdd
        const key = type === 'basal' ? 'modal_basalMessage_tdd' : 'modal_bolusMessage_tdd';
        const tddSourceKey = insulinFactors.source === 'weight' ? 'modal_tddSourceFromWeight' : 'modal_tddSourceFromLogs';
        message = t(key as keyof typeof strings.fa)
            .replace('{value}', value)
            .replace('{tddSourceText}', t(tddSourceKey))
            .replace('{noDataSourceMessage}', t('modal_noDataSourceInsulinMessage'));
    }
    
    setModalContent({ title, message });
  };
  
  const handleIobCardClick = () => {
    setModalContent({ title: t('modal_iobTitle'), message: t('modal_iobMessage') });
  };
  
  const avgBloodSugarValue = avgBloodSugar !== '—'
    ? <span className={getGlucoseColorClass(avgBloodSugar)}>{toPersianNum(avgBloodSugar, language)}</span>
    : avgBloodSugar;

  const fourHoursAgo = new Date(new Date().getTime() - 4 * 60 * 60 * 1000);
  const canEstimate = currentUser.logs.some(log => log.type === 'bloodSugar' && log.glucose && log.timestamp >= fourHoursAgo);

  return (
    <div className="p-4 flex-grow grid grid-cols-2 md:grid-cols-4 auto-rows-fr gap-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 pb-24">
      {isAiEnabled && (
        <div className="col-span-2 row-span-2">
          <GlucosePredictionCard 
            isEstimating={isEstimating}
            lastPrediction={lastPrediction}
            lastComparison={lastComparison}
            onEstimate={onEstimate}
            onStartComparison={onStartComparison}
            canEstimate={canEstimate}
            t={t}
            language={language}
            setModalContent={setModalContent}
          />
        </div>
      )}
      
      <StatCard label="ICR" value={icrString} onClick={() => handleCardClick('icr')} />
      <StatCard label="ISF" value={isfString} onClick={() => handleCardClick('isf')} />
      <StatCard label="BMI" value={bmiString} onClick={() => handleCardClick('bmi')} />
      <StatCard label="FF" value={ffString} onClick={() => handleCardClick('ff')} />
      <StatCard label="A1C" value={estimatedA1CString} onClick={() => handleCardClick('a1c')} />
      <StatCard label="TDD" value={toPersianNum(totalDailyInsulin > 0 ? totalDailyInsulin.toFixed(1) : '—', language)} onClick={() => handleCardClick('tdd')} />
      
      <SummaryStatCard label={t('avgGlucose')} value={avgBloodSugarValue} unit="mg/dL" icon={<TargetIcon className="h-5 w-5" />} />
      <SummaryStatCard label={t('totalInsulin')} value={toPersianNum(totalInsulin.toFixed(1), language)} unit={t('unit')} icon={<SyringeIcon className="h-5 w-5" />} />
      <SummaryStatCard label={t('totalCarbs')} value={toPersianNum(String(totalCarbs), language)} unit={t('gram')} icon={<WheatIcon className="h-5 w-5" />} />
      <SummaryStatCard label={t('totalActivity')} value={toPersianNum(String(totalActivity), language)} unit={t('minute')} icon={<FootprintsIcon className="h-5 w-5" />} />
      <SummaryStatCard label={t('estimatedBasal')} value={toPersianNum(basal.value > 0 ? basal.value.toFixed(1) : '—', language)} unit={t('unit')} icon={<MoonIcon className="h-5 w-5" />} onClick={() => handleInsulinCardClick('basal')} />
      <SummaryStatCard label={t('estimatedBolus')} value={toPersianNum(bolus.value > 0 ? bolus.value.toFixed(1) : '—', language)} unit={t('unit')} icon={<SunIcon className="h-5 w-5" />} onClick={() => handleInsulinCardClick('bolus')} />
      
      <div className="col-span-2">
        <SummaryStatCard 
          label={t('insulinOnBoard')} 
          value={toPersianNum(iob > 0 ? iob.toFixed(1) : '۰', language)} 
          unit={t('unit')} 
          icon={<ClockIcon className="h-5 w-5" />} 
          onClick={handleIobCardClick} 
        />
      </div>
    </div>
  );
};

export default Dashboard;