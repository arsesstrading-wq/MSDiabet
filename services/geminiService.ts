

import { GoogleGenAI, Type, Chat } from "@google/genai";
import type { User, LogEntry, MealType, Profile, InjectionSite } from '../types';
import { calculateIOB } from '../constants';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set for Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const OFFLINE_ERROR_MESSAGE_FA = "خطا: اتصال اینترنت برقرار نیست. برای استفاده از دستیار هوشمند، لطفاً به اینترنت متصل شوید.";

const getMealTypeName = (type?: MealType): string => {
    switch(type) {
        case 'breakfast': return 'صبحانه';
        case 'morning_snack': return 'میان وعده صبح';
        case 'lunch': return 'ناهار';
        case 'afternoon_snack': return 'میان وعده عصر';
        case 'dinner': return 'شام';
        case 'night_snack': return 'میان وعده شب';
        default: return 'وعده غذایی';
    }
};

const getBasalInsulinName = (insulin?: string): string => {
    switch(insulin) {
        case 'Toujeo': return 'توجئو';
        case 'Levemir': return 'لومیر';
        case 'Lantus': return 'لانتوس';
        case 'Other': return 'سایر';
        default: return 'نامشخص';
    }
};

const getBolusInsulinName = (insulin?: string): string => {
    switch(insulin) {
        case 'Rapidosulin': return 'راپیدسولین';
        case 'NovoRapid': return 'نووراپید';
        case 'Other': return 'سایر';
        default: return 'نامشخص';
    }
};

const getInjectionSiteName = (site?: InjectionSite): string => {
    if (!site) return 'نامشخص';
    const names: Record<InjectionSite, string> = { abdomen: 'شکم', arm: 'دست', leg: 'پا', buttocks: 'باسن' };
    return names[site];
};

const calculateAgeFromJalali = (birthDateStr?: string): string => {
    if (!birthDateStr || !birthDateStr.includes('/')) return 'نامشخص';
    try {
        const toEnglishNum = (str: string) => str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
        const birthYear = parseInt(toEnglishNum(birthDateStr.split('/')[0]), 10);
        
        const currentJalaliYearStr = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0];
        const currentJalaliYear = parseInt(currentJalaliYearStr, 10);
        
        if (isNaN(birthYear) || isNaN(currentJalaliYear)) {
             return 'نامشخص';
        }
        
        const age = currentJalaliYear - birthYear;
        
        return age >= 0 && age < 120 ? String(age) : 'نامشخص';
    } catch {
        return 'نامشخص';
    }
};

const buildUserContextForGemini = (currentUser: User): { contextText: string; recentLogsText: string } => {
    const recentLogs = currentUser.logs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 25)
      .map(log => {
        const timestamp = `${log.jalaliDate} ${log.time}` || 'زمان نامشخص';
        if (log.type === 'bloodSugar') {
          return `قند خون: ${log.glucose} mg/dL در ${timestamp}`;
        }
        if (log.type === 'meal') {
          const mealName = getMealTypeName(log.mealType);
          const description = log.description ? ` (${log.description})` : '';
          const fattyText = log.fatty ? ' این وعده چرب و با تاثیر تاخیری بوده است.' : '';
          const insulinText = log.insulinDose ? ` انسولین تزریقی: ${log.insulinDose} واحد${log.injectionSite ? ` در ${getInjectionSiteName(log.injectionSite)}` : ''}.` : '';
          return `${mealName}${description} با ${log.carbs} گرم کرบوهیدرات در ${timestamp}.${insulinText}${fattyText}`;
        }
        if (log.type === 'activity') {
          return `فعالیت: ${log.activityType} برای ${log.duration} دقیقه در ${timestamp}`;
        }
        if (log.type === 'insulin') {
          return `تزریق انسولین ${log.insulinType === 'basal' ? 'پایه' : 'غذایی'}: ${log.insulinDose} واحد${log.injectionSite ? ` در ${getInjectionSiteName(log.injectionSite)}` : ''} در ${timestamp}`;
        }
        if (log.type === 'mood') {
          const moodText = Array.isArray(log.mood) ? log.mood.join('، ') : log.mood;
          return `حال روزانه: ${moodText}${log.description ? ` (${log.description})` : ''} در ${timestamp}`;
        }
        if (log.type === 'physicalCondition') {
          const conditionText = Array.isArray(log.condition) ? log.condition.join('، ') : log.condition;
          return `وضعیت جسمانی: ${conditionText}${log.description ? ` (${log.description})` : ''} در ${timestamp}`;
        }
        if (log.type === 'medication') {
          return `داروی مصرفی: ${log.medicationName}، دوز: ${log.medicationDose} ${log.medicationUnit || ''} در ${timestamp}`;
        }
        return '';
      }).filter(Boolean);

    const ageStr = calculateAgeFromJalali(currentUser.profile.birthDate);
    const ageNum = ageStr !== 'نامشخص' ? parseInt(ageStr, 10) : null;
    const gender = currentUser.profile.gender;

    const isInPuberty = (gender === 'female' && ageNum && ageNum >= 9 && ageNum <= 17) || 
                        (gender === 'male' && ageNum && ageNum >= 11 && ageNum <= 19);

    let menstrualInfo = '';
    if (gender === 'female' && currentUser.profile.lastPeriodStartDate && currentUser.profile.cycleLength) {
        menstrualInfo = `تاریخ آخرین عادت ماهیانه: ${currentUser.profile.lastPeriodStartDate}, طول معمول دوره: ${currentUser.profile.cycleLength} روز`;
    }

    const basalInsulinName = getBasalInsulinName(currentUser.profile.basalInsulin);
    const bolusInsulinName = getBolusInsulinName(currentUser.profile.bolusInsulin);

    const userInjectionSitePriority = (currentUser.profile.injectionSitePriority && currentUser.profile.injectionSitePriority.length > 0)
      ? `اولویت‌بندی محل تزریق توسط بیمار (از سریع‌ترین به کندترین): ${currentUser.profile.injectionSitePriority.map(site => getInjectionSiteName(site)).join('، ')}`
      : '';
      
    const recentLogsText = recentLogs.join('\n');

    const contextText = `
      اطلاعات حساب کاربری بیمار:
      سن: ${ageStr} سال
      جنسیت: ${currentUser.profile.gender === 'male' ? 'مرد' : currentUser.profile.gender === 'female' ? 'زن' : 'نامشخص'}
      وزن: ${currentUser.profile.weight || 'نامشخص'} کیلوگرم
      قد: ${currentUser.profile.height || 'نامشخص'} سانتیمتر
      انسولین پایه: ${basalInsulinName}
      انسولین غذایی: ${bolusInsulinName}
      ${userInjectionSitePriority}
      ${isInPuberty ? 'وضعیت: در دوران بلوغ' : ''}
      ${menstrualInfo}
      
      آخرین اطلاعات ثبت‌شده توسط بیمار:
      ${recentLogsText}
    `;
    return { contextText, recentLogsText };
};


export const analyzeDataWithGemini = async (currentUser: User): Promise<string> => {
  if (!navigator.onLine) return OFFLINE_ERROR_MESSAGE_FA;
  if (!process.env.API_KEY) {
    return "خطا: کلید API برای سرویس هوش مصنوعی تنظیم نشده است. لطفا با پشتیبانی تماس بگیرید.";
  }
  
  const { contextText } = buildUserContextForGemini(currentUser);

  const predictionComparisonLogs = currentUser.logs
      .filter(log => log.type === 'bloodSugar' && typeof log.predictedGlucose === 'number' && log.glucose)
      .slice(-10)
      .map(log => `در تاریخ ${log.jalaliDate} ساعت ${log.time}، تخمین برنامه ${log.predictedGlucose} و قند واقعی ${log.glucose} بوده است.`);

  let predictionAnalysisSection = '';
  if (predictionComparisonLogs.length > 0) {
      predictionAnalysisSection = `
  ۴. **تحلیل و یادگیری تخمین‌ها:**
  - برنامه در حال یادگیری بدن شماست. در ادامه نتایج مقایسه قند تخمین‌زده شده با مقدار واقعی آمده است:
  ${predictionComparisonLogs.join('\n')}
  - این نتایج را تحلیل کن. آیا تخمین‌ها به طور مداوم بالا یا پایین هستند؟ آیا الگوی خاصی در خطاها وجود دارد (مثلاً بعد از وعده‌های چرب یا ورزش)؟
  - بر اساس این الگو، یک توصیه برای بهبود دقت تخمین‌ها در آینده ارائه بده. (مثال: "به نظر می‌رسد تخمین‌های من بعد از ناهار کمی بالاست. شاید لازم باشد نسبت انسولین به کربوهیدرات برای ناهار را با پزشکت بازبینی کنی تا دقت برنامه بیشتر شود.")
      `;
  }

  const prompt = `
    شما یک دستیار هوش مصنوعی متخصص و دلسوز برای مدیریت دیابت هستید. اطلاعات زیر از یک بیمار دیابتی به شما داده شده است. لطفا با استفاده از این اطلاعات، یک تحلیل جامع، کاربردی و دوستانه به زبان فارسی ارائه دهید.

    **نکات مهم برای تحلیل:**
    - **قانون کلی محل تزریق:** سرعت جذب انسولین به ترتیب از شکم (سریع‌ترین)، دست، پا و باسن (کندترین) کاهش می‌یابد.
    - **بلوغ (نوجوانی):** هورمون‌ها مقاومت به انسولین را افزایش داده و باعث نوسان ۲۰ تا ۴۰ درصدی قند خون می‌شوند.
    - **عادت ماهیانه:** در نیمه دوم چرخه، پروژسترون و استروژن می‌توانند قند خون را ۱۰ تا ۳۰ درصد افزایش دهند.
    - **استرس و ترس:** هورمون‌های استرس (آدرنالین و کورتیزول) می‌توانند قند خون را ۲۰ تا ۸۰ mg/dl افزایش دهند.
    - **بیماری و علائم فیزیکی:** بیماری‌هایی مانند سرماخوردگی، تب و لرز، یا عفونت‌ها می‌توانند مقاومت به انسولین را به شدت افزایش داده و قند خون را ۲۵ تا ۱۰۰ درصد بالا ببرند. استرس فیزیکی ناشی از سردرد یا دل‌درد نیز می‌تواند باعث نوسان قند خون شود.
    - **داروها:** به تاثیر داروهای ثبت شده توسط کاربر توجه کن. برخی داروها (مانند کورتون‌ها) می‌توانند قند خون را به شدت افزایش دهند.
    
    ${contextText}
    
    **وظیفه شما:**
    یک تحلیل جامع و کاربردی در چند بخش ارائه دهید. لحن شما باید همیشه مثبت، تشویق‌کننده و غیرپزشکی باشد.

    ۱. **امتیاز کلی و تشویق:**
    - ابتدا یک امتیاز کلی از ۱ تا ۱۰ به نحوه مدیریت دیابت کاربر در چند روز اخیر بدهید.
    - یک جمله تشویق‌کننده بنویسید و او را برای ادامه مسیر ترغیب کنید.

    ۲. **تحلیل الگوها:**
    - الگوهای بین حالات روحی/هورمونی/بیماری ثبت‌شده (بلوغ، عادت ماهیانه، استرس، سردرد، تب و لرز) و نوسانات قند خون را شناسایی کنید.
    - تاثیر داروهای مصرفی را بر الگوهای قند خون در نظر بگیر.
    - الگوهای مربوط به محل تزریق انسولین را تحلیل کنید. (مثال: آیا تزریق در شکم باعث افت قند سریع شده؟)

    ۳. **توصیه‌های عملی و هوشمند:**
    - **در صورت قند خون بالا:**
        - راهکارهای مشخصی برای اصلاح پیشنهاد دهید: نوشیدن آب، پیاده‌روی سبک.
        - اگر نیاز به **انسولین اصلاحی** هست، به وضوح بگویید.
        - هنگام توصیه به تزریق اصلاحی، **شرایط را در نظر بگیرید:**
            - **انسولین فعال (IOB):** "چون به تازگی انسولین تزریق کرده‌ای، با احتیاط دوز اصلاحی را تزریق کن."
            - **فعالیت بدنی اخیر:** "بعد از ورزش بدنت به انسولین حساس‌تر است، شاید دوز کمتری نیاز باشد."
            - **محل تزریق:** "برای تاثیر سریع‌تر، از محلی مانند شکم برای تزریق استفاده کن."
            - **وضعیت هورمونی/بیماری:** "در دوران قاعدگی/بلوغ/بیماری، ممکن است به دوز متفاوتی نیاز داشته باشی."
            - **وضعیت روحی:** "استرس می‌تواند قند را بالا ببرد، حواست به این موضوع باشد."
    - **در صورت افت قند خون:**
        - مواد غذایی مشخصی برای رفع افت پیشنهاد دهید. (مثال: "برای رفع افت قend، ۱۵ گرم کربوهیدرات سریع‌الجذب مثل نصف لیوان آبمیوه یا ۳ حبه قند مصرف کن.")
        - یادآوری کنید که ۱۵ دقیقه بعد قند خون را دوباره چک کند.
    - **زمان‌بندی انسولین پایه:**
        - بر اساس قندهای ناشتا و الگوی خواب، یک **ساعت پیشنهادی برای تزریق انسولین پایه** ارائه دهید. (مثال: "قندهای ناشتای تو کمی بالاست. شاید تزریق انسولین پایه حدود ساعت ۱۰ شب به جای ۸ شب، به کنترل بهتر کمک کند. این مورد را با پزشکت مطرح کن.")
    - **توصیه‌های عمومی:**
        - پیشنهاد میان‌وعده‌های سالم بدهید و به اهمیت نوشیدن آب اشاره کنید.

    ${predictionAnalysisSection}

    پاسخ خود را با فرمت Markdown ارائه دهید تا خوانایی بهتری داشته باشد.
    `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    return "متاسفانه در ارتباط با سرویس هوش مصنوعی خطایی رخ داد. لطفا بعدا دوباره تلاش کنید.";
  }
};

const calculateLinearRegressionPrediction = (logs: LogEntry[]): number | null => {
    const recentBgLogs = logs
        .filter(l => l.type === 'bloodSugar' && l.glucose)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 2)
        .map(l => ({
            time: l.timestamp.getTime(),
            glucose: parseInt(l.glucose!, 10)
        }));

    if (recentBgLogs.length < 2) return null;

    const [p1, p2] = recentBgLogs; // p1 is newer, p2 is older
    if (p1.time === p2.time) return p1.glucose;

    const slope = (p1.glucose - p2.glucose) / (p1.time - p2.time);
    const intercept = p1.glucose - slope * p1.time;
    const currentTime = new Date().getTime();
    const prediction = slope * currentTime + intercept;

    if (prediction > 20 && prediction < 600) {
        return Math.round(prediction);
    }
    return null;
};

export const estimateGlucoseWithGemini = async (currentUser: User): Promise<number | null> => {
    if (!navigator.onLine) return null;
    if (!process.env.API_KEY) {
        console.warn("API Key not set for Gemini.");
        return null;
    }

    const { contextText } = buildUserContextForGemini(currentUser);
    const linearPrediction = calculateLinearRegressionPrediction(currentUser.logs);
    
    const linearPredictionText = linearPrediction 
        ? `A simple linear regression model based on the last two readings predicts the current glucose to be around ${linearPrediction} mg/dL. Use this as a rough guide, but give more weight to factors like insulin, carbs, and exercise in your final estimation.`
        : '';

    const prompt = `
        You are a highly advanced AI model simulating a continuous glucose monitor. Your task is to predict a user's current blood glucose level based on their recent logs.
        
        ${contextText}

        ${linearPredictionText}

        **Your Task:**
        1. Find the last recorded blood glucose reading.
        2. Analyze all events that occurred *after* that reading: meals (note fatty/delayed ones), insulin doses (bolus), physical activity, illnesses, and medications.
        3. Model the effects:
            - Insulin lowers glucose over ~4 hours.
            - Carbs raise glucose over ~3 hours (longer for fatty meals).
            - Activity increases insulin sensitivity, lowering glucose.
            - Illness (like fever) increases insulin resistance, raising glucose.
        4. Based on this simulation, calculate the user's **current** blood glucose level.

        **Response Format:**
        Return ONLY a single integer representing the estimated blood glucose in mg/dL. Do NOT include "mg/dL", explanations, or any other text.
        
        Example response: 142
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2,
            }
        });
        
        const estimatedValue = parseInt(response.text.trim(), 10);
        if (isNaN(estimatedValue)) {
            console.error("Gemini returned a non-numeric value for glucose estimation:", response.text);
            return null;
        }
        return estimatedValue;

    } catch (error) {
        console.error("Gemini glucose estimation call failed:", error);
        return null;
    }
};

export const getCarbInfoForFood = async (foodName: string): Promise<{ foodName: string; carbsPer100g: number; servingDescription: string } | null> => {
  if (!navigator.onLine) return null;
  if (!process.env.API_KEY) {
    console.warn("API Key not set for Gemini.");
    return null;
  }

  const prompt = `Provide the carbohydrate content for the following food item: "${foodName}".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING, description: "The common name of the food in Persian." },
            carbsPer100g: { type: Type.NUMBER, description: "Grams of carbohydrates per 100 grams of the food." },
            servingDescription: { type: Type.STRING, description: "A brief description of the serving size, e.g., '100g'." },
          },
          required: ["foodName", "carbsPer100g", "servingDescription"],
        },
        temperature: 0.1,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) return null;
    
    const parsedJson = JSON.parse(jsonText);
    if (typeof parsedJson.carbsPer100g === 'number') {
        return parsedJson;
    }
    return null;

  } catch (error) {
    console.error("Gemini carb info call failed:", error);
    return null;
  }
};

export const getSmartBolusSuggestion = async (currentUser: User, carbs: number, mealDescription: string): Promise<{ suggestedDose: number; reasoning: string } | null> => {
  if (!navigator.onLine) return null;
  if (!process.env.API_KEY) {
    console.warn("API Key not set for Gemini.");
    return null;
  }
  
  const iob = calculateIOB(currentUser);
  const { contextText } = buildUserContextForGemini(currentUser);
  const iobText = iob > 0 ? `The user currently has approximately ${iob.toFixed(1)} units of active insulin (IOB). This amount should be considered and potentially subtracted from any correction component of the final bolus suggestion.` : '';

  const prompt = `
    ${contextText}
    
    ${iobText}

    **Task:**
    The user is about to eat a meal with **${carbs} grams of carbohydrates**.
    The meal is described as: "${mealDescription || 'Not specified'}".

    Based on all the provided user data (recent logs, profile, etc.), suggest an appropriate bolus insulin dose.
    - Consider insulin-on-board from recent injections.
    - Consider increased insulin sensitivity from recent exercise.
    - Consider hormonal states (puberty, menstrual cycle).
    - **Crucially, consider any recent signs of illness (fever, cold) which significantly increase insulin needs.**
    - Provide a clear, concise reasoning for your suggestion in Persian.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedDose: { type: Type.NUMBER, description: "The suggested insulin dose in full or half units (e.g., 4.5)." },
            reasoning: { type: Type.STRING, description: "A brief, clear explanation in Persian for the suggested dose, considering user's context." },
          },
          required: ["suggestedDose", "reasoning"],
        },
        temperature: 0.3,
      },
    });
    
    const jsonText = response.text.trim();
    if (!jsonText) return null;

    const parsedJson = JSON.parse(jsonText);
    if (typeof parsedJson.suggestedDose === 'number') {
        parsedJson.suggestedDose = Math.round(parsedJson.suggestedDose * 2) / 2; // Round to nearest 0.5
        return parsedJson;
    }
    return null;

  } catch (error) {
    console.error("Gemini smart bolus call failed:", error);
    return null;
  }
};


export const getDailyTipWithGemini = async (currentUser: User): Promise<string> => {
    if (!navigator.onLine) return "امروز موفق باشی! یادت نره آب کافی بنوشی.";
    if (!process.env.API_KEY) {
        return "برای دریافت نکات روزانه، لطفا کلید API را تنظیم کنید.";
    }

    const { contextText } = buildUserContextForGemini(currentUser);

    const prompt = `
        You are a friendly and encouraging diabetes management assistant. 
        Based on the user's recent data, provide one short, actionable, and positive tip for today in Persian.
        Keep it concise (1-2 sentences). Focus on a specific pattern you see in their data (e.g., high morning sugars, good post-meal numbers, lack of activity logs, recent illness) and give a related, encouraging tip.

        ${contextText}

        Tip for today:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
            }
        });
        
        return response.text.trim();
    } catch (error) {
        console.error("Gemini daily tip call failed:", error);
        return "امروز موفق باشی! یادت نره آب کافی بنوشی."; // A fallback tip
    }
};


export const getCarbsFromImageWithGemini = async (base64Image: string): Promise<{ estimatedCarbs: number, foodDescription: string } | null> => {
  if (!navigator.onLine) return null;
  if (!process.env.API_KEY) {
    console.warn("API Key not set for Gemini.");
    return null;
  }

  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };

  const textPart = {
    text: "Analyze the food in this image. Be as accurate as possible. Return a JSON object with two keys: 'estimatedCarbs' (total carbohydrates in grams as a number) and 'foodDescription' (a brief description of the food in Persian).",
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            estimatedCarbs: { type: Type.NUMBER },
            foodDescription: { type: Type.STRING },
          },
          required: ["estimatedCarbs", "foodDescription"],
        },
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) return null;

    const parsedJson = JSON.parse(jsonText);
    if (typeof parsedJson.estimatedCarbs === 'number') {
      return parsedJson;
    }
    return null;

  } catch (error) {
    console.error("Gemini image carb analysis call failed:", error);
    return null;
  }
};

export const startChat = (currentUser: User): Chat => {
    const { contextText } = buildUserContextForGemini(currentUser);
    const systemInstruction = `
        You are "Sweet Dream AI", a friendly, empathetic, and knowledgeable diabetes assistant. 
        You are NOT a doctor and you MUST NOT give medical advice. 
        Always remind the user to consult their doctor for medical decisions.
        Use the user's data to answer their questions in a helpful and safe way.
        Keep your answers concise and easy to understand.
        The user's language is Persian. Respond in Persian.
        ${contextText}
    `;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
    });
};

export const getChatbotResponse = async (chat: Chat, message: string): Promise<string> => {
    if (!navigator.onLine) return OFFLINE_ERROR_MESSAGE_FA;
    try {
        const response = await chat.sendMessage({ message });
        return response.text;
    } catch (error) {
        console.error("Gemini chatbot call failed:", error);
        return "متاسفانه در ارتباط با سرویس هوش مصنوعی خطایی رخ داد. لطفا بعدا دوباره تلاش کنید.";
    }
};

export const predictFutureGlucose = async (currentUser: User): Promise<string> => {
    if (!navigator.onLine) return OFFLINE_ERROR_MESSAGE_FA;
    const { contextText } = buildUserContextForGemini(currentUser);
    const prompt = `
        ${contextText}

        **Task:**
        Based on the user's most recent data, predict the blood glucose trend for the next 2 hours.
        - Identify the key factors that will influence the trend (e.g., "active insulin from the last meal", "recent high-intensity exercise").
        - Provide a short, clear prediction (e.g., "likely to remain stable," "may slowly decrease," "will likely rise and then fall").
        - If you predict a significant rise (hyperglycemia) or fall (hypoglycemia), issue a clear but calm warning.
        - The response should be in Persian.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.4 }
        });
        return response.text;
    } catch (error) {
        console.error("Gemini future prediction call failed:", error);
        return "امکان پیش‌بینی روند قند خون در حال حاضر وجود ندارد.";
    }
};