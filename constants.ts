

import type { Profile, User } from './types';
import { toEnglishNum } from './utils';

export const DEFAULT_PROFILE: Profile = {
    birthDate: '',
    gender: '',
    height: '',
    weight: '',
    diabetesType: '',
    totalDailyInsulin: '',
    basalInsulin: '',
    bolusInsulin: '',
    lastPeriodStartDate: '',
    cycleLength: '',
    injectionSitePriority: ['abdomen', 'arm', 'leg', 'buttocks'],
    emergencyContacts: [],
    photo: '',
};

export const getGlucoseColorClass = (glucose: number | string | undefined): string => {
  const numGlucose = typeof glucose === 'string' ? parseInt(toEnglishNum(glucose), 10) : glucose;
  if (numGlucose === undefined || isNaN(numGlucose)) return 'text-gray-800 dark:text-gray-100';

  if (numGlucose < 80) return 'text-red-500 font-bold';
  if (numGlucose <= 180) return 'text-green-500 font-bold';
  if (numGlucose <= 220) return 'text-yellow-500 font-bold';
  return 'text-orange-500 font-bold';
};

export const calculateAge = (birthDateStr?: string): number | null => {
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


const getAgeAdjustmentFactor = (profile: Profile): number => {
    const age = calculateAge(profile.birthDate);
    const gender = profile.gender;

    if (!age || !gender) return 1.0;

    // Increased insulin needs during puberty (approx. 25% more)
    const isInPuberty = (gender === 'female' && age >= 9 && age <= 17) || 
                        (gender === 'male' && age >= 11 && age <= 19);
    if (isInPuberty) {
        return 1.25;
    }

    // Gradually decreasing sensitivity after age 40 (0.5% per year)
    if (age > 40) {
        const yearsOver40 = age - 40;
        const adjustment = 1.0 + (yearsOver40 * 0.005);
        return Math.min(adjustment, 1.4); // Cap at 40% increase to prevent extreme values
    }

    return 1.0;
};


export const calculateInsulinFactors = (currentUser: User | undefined | null): { tdd: number; isf: number; icr: number; source: 'logs' | 'weight' | 'none' } => {
  if (!currentUser) return { tdd: 0, isf: 0, icr: 0, source: 'none' };
  
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentInsulinLogs = currentUser.logs.filter(log =>
      new Date(log.timestamp) >= fourteenDaysAgo &&
      ((log.type === 'meal' && log.insulinDose) || log.type === 'insulin')
  );
  
  let tdd = 0;
  let source: 'logs' | 'weight' | 'none' = 'none';

  if (recentInsulinLogs.length > 0) {
      const dailyTotals = new Map<string, number>();
      recentInsulinLogs.forEach(log => {
          const dose = parseFloat(toEnglishNum(log.insulinDose) || '0');
          if (dose > 0) {
              const day = log.jalaliDate;
              dailyTotals.set(day, (dailyTotals.get(day) || 0) + dose);
          }
      });
      if (dailyTotals.size > 0) {
          const totalInsulinSum = Array.from(dailyTotals.values()).reduce((sum, dailyDose) => sum + dailyDose, 0);
          const averageTDD = totalInsulinSum / dailyTotals.size;
          if (averageTDD > 0) {
              tdd = averageTDD;
              source = 'logs';
          }
      }
  }
  
  if (tdd === 0) {
      const weight = parseFloat(toEnglishNum(currentUser.profile.weight));
      if (weight && weight > 0) {
          tdd = weight / 2;
          source = 'weight';
      }
  }
  
  if (tdd === 0) {
      return { tdd: 0, isf: 0, icr: 0, source: 'none' };
  }

  const adjustmentFactor = getAgeAdjustmentFactor(currentUser.profile);
  const adjustedTDD = tdd * adjustmentFactor;

  const isf = adjustedTDD > 0 ? 1800 / adjustedTDD : 0;
  const icr = adjustedTDD > 0 ? 500 / adjustedTDD : 0;
  
  return { tdd, isf, icr, source };
};

export const calculateIOB = (currentUser: User | undefined | null): number => {
    if (!currentUser) return 0;

    const INSULIN_ACTION_HOURS = 4;
    const INSULIN_ACTION_MILLIS = INSULIN_ACTION_HOURS * 60 * 60 * 1000;
    const now = new Date().getTime();

    const recentBolusLogs = currentUser.logs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return (now - logTime) < INSULIN_ACTION_MILLIS &&
               log.insulinDose &&
               ((log.type === 'meal') || (log.type === 'insulin' && log.insulinType === 'bolus'));
    });

    let totalIOB = 0;

    recentBolusLogs.forEach(log => {
        const dose = parseFloat(toEnglishNum(log.insulinDose) || '0');
        if (dose <= 0) return;
        
        const timeElapsed = now - new Date(log.timestamp).getTime();
        
        // Linear decay model
        const insulinRemaining = dose * (1 - (timeElapsed / INSULIN_ACTION_MILLIS));
        
        if (insulinRemaining > 0) {
            totalIOB += insulinRemaining;
        }
    });

    return totalIOB > 0 ? parseFloat(totalIOB.toFixed(1)) : 0;
};