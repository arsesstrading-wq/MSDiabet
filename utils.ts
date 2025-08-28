
import type { Language } from './types';

const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const toPersianNum = (n: string | number | undefined, lang: Language): string => {
    if (n === undefined || n === null) return '';
    const str = String(n);
    if (lang === 'en') {
        return str;
    }
    return str.replace(/[0-9]/g, (d) => persianNumerals[parseInt(d)]);
};


export const toEnglishNum = (str: string | undefined): string => {
    if (!str) return '';
    return str
        .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
        .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
};
