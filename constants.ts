

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

export const themeColorPalettes = {
  indigo: { '50': '238 242 255', '100': '224 231 255', '200': '199 210 254', '300': '165 180 252', '400': '129 140 248', '500': '99 102 241', '600': '79 70 229', '700': '67 56 202', '800': '55 48 163', '900': '49 46 129', '600-val': '#4f46e5', '400-val': '#818cf8' },
  pink: { '50': '253 242 248', '100': '252 231 243', '200': '251 207 232', '300': '249 168 212', '400': '244 114 182', '500': '236 72 153', '600': '219 39 119', '700': '190 24 93', '800': '157 23 77', '900': '131 24 67', '600-val': '#db2777', '400-val': '#f9a8d4' },
  blue: { '50': '239 246 255', '100': '219 234 254', '200': '191 219 254', '300': '147 197 253', '400': '96 165 250', '500': '59 130 246', '600': '37 99 235', '700': '29 78 216', '800': '30 64 175', '900': '30 58 138', '600-val': '#2563eb', '400-val': '#60a5fa' },
  green: { '50': '240 253 244', '100': '220 252 231', '200': '187 247 208', '300': '134 239 172', '400': '74 222 128', '500': '34 197 94', '600': '22 163 74', '700': '21 128 61', '800': '22 101 52', '900': '20 83 45', '600-val': '#16a34a', '400-val': '#4ade80' },
  orange: { '50': '255 247 237', '100': '255 237 213', '200': '254 215 170', '300': '253 186 116', '400': '251 146 60', '500': '249 115 22', '600': '234 88 12', '700': '194 65 12', '800': '154 52 18', '900': '124 45 18', '600-val': '#ea580c', '400-val': '#fb923c' },
  teal: { '50': '240 253 250', '100': '204 251 241', '200': '153 246 228', '300': '94 234 212', '400': '45 212 191', '500': '20 184 166', '600': '13 148 136', '700': '15 118 110', '800': '17 94 89', '900': '19 78 74', '600-val': '#0d9488', '400-val': '#2dd4bf' },
  red: { '50': '254 242 242', '100': '254 226 226', '200': '254 202 202', '300': '252 165 165', '400': '248 113 113', '500': '239 68 68', '600': '220 38 38', '700': '185 28 28', '800': '153 27 27', '900': '127 29 29', '600-val': '#dc2626', '400-val': '#f87171' },
  amber: { '50': '255 251 235', '100': '254 243 199', '200': '253 230 138', '300': '252 211 77', '400': '251 191 36', '500': '245 158 11', '600': '217 119 6', '700': '180 83 6', '800': '146 64 14', '900': '120 53 15', '600-val': '#d97706', '400-val': '#fbbd23' },
  rose: { '50': '255 241 242', '100': '255 228 230', '200': '254 205 211', '300': '253 164 175', '400': '251 113 133', '500': '244 63 94', '600': '225 29 72', '700': '190 18 60', '800': '159 18 57', '900': '136 19 55', '600-val': '#e11d48', '400-val': '#fb7185' },
  slate: { '50': '248 250 252', '100': '241 245 249', '200': '226 232 240', '300': '203 213 225', '400': '148 163 184', '500': '100 116 139', '600': '71 85 105', '700': '51 65 85', '800': '30 41 59', '900': '15 23 42', '600-val': '#475569', '400-val': '#94a3b8' },
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