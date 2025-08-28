
import type { MealType, InjectionSite, ModalContent } from '../types';
import { toPersianNum } from '../utils';

const dynamicStrings = {
    fa: {
        getMealTypeName: (type?: MealType): string => {
            const names: Record<MealType, string> = {
                breakfast: 'صبحانه',
                morning_snack: 'میان وعده صبح',
                lunch: 'ناهار',
                afternoon_snack: 'میان وعده عصر',
                dinner: 'شام',
                night_snack: 'میان وعده شب',
            };
            return type ? names[type] : 'وعده غذایی';
        },
        getInjectionSiteName: (site?: InjectionSite): string => {
            if (!site) return '';
            const names: Record<InjectionSite, string> = { abdomen: 'شکم', arm: 'دست', leg: 'پا', buttocks: 'باسن' };
            return names[site] || '';
        },
        getHypoAlert: (glucose: number): ModalContent => ({
            title: '⚠️ افت قند خون',
            message: `قند خون شما **${toPersianNum(glucose, 'fa')} mg/dL** است که پایین‌تر از حد نرمال است.\n\n**لطفاً فوراً برای رفع افت قند اقدام کنید.** مصرف ۱۵ گرم کربوهیدرات ساده (مانند آبمیوه یا قرص گلوکز) توصیه می‌شود.`
        }),
        getExerciseAdvice: (glucose: number): ModalContent | null => {
            if (glucose < 100) {
                return {
                    title: '⚠️ احتیاط قبل از ورزش',
                    message: `قند خون شما **${toPersianNum(glucose, 'fa')} mg/dL** است.\n\n**خطر افت قند خون وجود دارد.** بهتر است قبل از شروع ورزش، ۱۰ تا ۲۰ گرم کربوهیدرات مصرف کنید.`
                };
            }
            if (glucose > 250 && glucose <= 300) {
                return {
                    title: '❗احتیاط برای ورزش',
                    message: `قند خون شما **${toPersianNum(glucose, 'fa')} mg/dL** است.\n\n**با احتیاط ورزش کنید.** اگر کتون در ادرار یا خون ندارید، می‌توانید ورزش سبک انجام دهید. در غیر این صورت، ورزش ممنوع است.`
                };
            }
            if (glucose > 300) {
                return {
                    title: '🚫 ورزش ممنوع',
                    message: `قند خون شما **${toPersianNum(glucose, 'fa')} mg/dL** است.\n\n**ورزش نکنید!** احتمال بالا رفتن بیشتر قند و کتواسیدوز وجود دارد.`
                };
            }
            return null;
        },
        getEmergencyMessage: (name: string, location: string): string => {
            return `این یک پیام اضطراری از طرف ${name} است. من در شرایط سختی هستم. موقعیت مکانی فعلی من: ${location}`;
        }
    },
    en: {
        getMealTypeName: (type?: MealType): string => {
            const names: Record<MealType, string> = {
                breakfast: 'Breakfast',
                morning_snack: 'Morning Snack',
                lunch: 'Lunch',
                afternoon_snack: 'Afternoon Snack',
                dinner: 'Dinner',
                night_snack: 'Night Snack',
            };
            return type ? names[type] : 'Meal';
        },
        getInjectionSiteName: (site?: InjectionSite): string => {
            if (!site) return '';
            const names: Record<InjectionSite, string> = { abdomen: 'Abdomen', arm: 'Arm', leg: 'Leg', buttocks: 'Buttocks' };
            return names[site] || '';
        },
        getHypoAlert: (glucose: number): ModalContent => ({
            title: '⚠️ Hypoglycemia Alert',
            message: `Your blood sugar is **${toPersianNum(glucose, 'en')} mg/dL**, which is below the normal range.\n\n**Please take immediate action to treat the low.** It is recommended to consume 15 grams of simple carbohydrates (like juice or glucose tablets).`
        }),
        getExerciseAdvice: (glucose: number): ModalContent | null => {
            if (glucose < 100) {
                return {
                    title: '⚠️ Caution Before Exercise',
                    message: `Your blood sugar is **${toPersianNum(glucose, 'en')} mg/dL**.\n\n**There is a risk of hypoglycemia.** It's advisable to consume 10-20 grams of carbohydrates before starting your workout.`
                };
            }
            if (glucose > 250 && glucose <= 300) {
                return {
                    title: '❗Exercise with Caution',
                    message: `Your blood sugar is **${toPersianNum(glucose, 'en')} mg/dL**.\n\n**Exercise with caution.** You may engage in light exercise if you have no ketones in your urine or blood. Otherwise, exercise is not recommended.`
                };
            }
            if (glucose > 300) {
                return {
                    title: '🚫 Do Not Exercise',
                    message: `Your blood sugar is **${toPersianNum(glucose, 'en')} mg/dL**.\n\n**Do not exercise!** There's a high risk of further increasing your blood sugar and developing ketoacidosis.`
                };
            }
            return null;
        },
        getEmergencyMessage: (name: string, location: string): string => {
            return `This is an emergency alert from ${name}. I may be in distress. My current location is: ${location}`;
        }
    }
};

export default dynamicStrings;
