


export type View = 'dashboard' | 'profile' | 'settings' | 'logBloodSugar' | 'logMeal' | 'logActivity' | 'graph' | 'logHistory' | 'logSleep' | 'logInsulin' | 'logMood' | 'correctionDoseCalculator' | 'aiAnalysis' | 'tools' | 'carbTable' | 'logMealWithCamera' | 'logMedication' | 'logPhysicalCondition' | 'aiTools' | 'chatbot' | 'emergency' | 'goals' | 'reportPreview' | 'diabetesIdCard' | 'diabetesEncyclopedia';

export type MealType = 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'night_snack';

export type SummaryTimeFrame = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export type InjectionSite = 'abdomen' | 'arm' | 'leg' | 'buttocks';

export type ColorTheme = 'indigo' | 'pink' | 'blue' | 'green' | 'orange' | 'teal' | 'red' | 'amber' | 'rose' | 'slate';

export type DisplayTheme = 'light' | 'dark' | 'auto';

export type Language = 'fa' | 'en';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface Reminder {
  id: string;
  type: 'check_bg' | 'take_meds';
  time: string; // "HH:mm"
  enabled: boolean;
}

export interface Goal {
  id: string;
  type: 'avg_glucose' | 'daily_activity';
  targetValue: number;
  timeFrame: 'weekly' | 'monthly';
  status: 'active' | 'completed';
  startDate: string; // ISO string
}

export interface Profile {
  birthDate: string;
  gender: 'male' | 'female' | '';
  height: string;
  weight: string;
  diabetesType: 'type1' | 'type2' | 'gestational' | 'other' | '';
  totalDailyInsulin: string;
  basalInsulin: string;
  bolusInsulin: string;
  lastPeriodStartDate?: string; // e.g. "۱۴۰۳/۰۵/۰۱"
  cycleLength?: string; // e.g. "28"
  injectionSitePriority: InjectionSite[];
  emergencyContacts: EmergencyContact[];
  photo?: string; // base64 encoded image
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  jalaliDate: string;
  time: string;
  type: 'bloodSugar' | 'meal' | 'activity' | 'sleep' | 'insulin' | 'mood' | 'medication' | 'physicalCondition';
  glucose?: string;
  predictedGlucose?: number; // For comparing AI prediction with actual value
  carbs?: string;
  fatty?: boolean;
  insulinDose?: string;
  postMealActivity?: string;
  mealType?: MealType;
  description?: string;
  activityType?: string;
  duration?: string;
  sleepTime?: string;
  insulinType?: 'basal' | 'bolus';
  mood?: string[];
  injectionSite?: InjectionSite;
  // New medication fields
  medicationName?: string;
  medicationDose?: string;
  medicationUnit?: string;
  // New physical condition field
  condition?: string[];
}

export interface User {
  id: string;
  name: string;
  profile: Profile;
  logs: LogEntry[];
  reminders: Reminder[];
  goals: Goal[];
}

export interface FoodItem {
    name: string;
    carbsPer100g: number;
}

export interface ModalContent {
    title: string;
    message: string;
}