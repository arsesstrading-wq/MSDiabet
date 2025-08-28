

import React, { useState, useEffect } from 'react';
import type { User, View, Language } from '../types';
import Header from './Header';
import { calculateInsulinFactors } from '../constants';
import { LightbulbIcon, GeminiIcon } from './Icons';
import { getCarbInfoForFood, getSmartBolusSuggestion } from '../services/geminiService';
import type { strings } from '../localization/strings';
import { toPersianNum, toEnglishNum } from '../utils';


interface CorrectionDoseCalculatorProps {
  currentUser: User;
  setView: (view: View) => void;
  isAiEnabled: boolean;
  t: (key: keyof typeof strings.fa) => string;
  language: Language;
}

type CalculatorTab = 'correction' | 'carb' | 'smart';

const CorrectionDoseCalculator: React.FC<CorrectionDoseCalculatorProps> = ({ currentUser, setView, isAiEnabled, t, language }) => {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('correction');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header title={t('doseCalculatorTitle')} onBack={() => setView('tools')} />
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex justify-around -mb-px">
          <TabButton title={t('correctionDose')} isActive={activeTab === 'correction'} onClick={() => setActiveTab('correction')} />
          <TabButton title={t('carbAndCalories')} isActive={activeTab === 'carb'} onClick={() => setActiveTab('carb')} />
          <TabButton title={t('smartMealDose')} isActive={activeTab === 'smart'} onClick={() => setActiveTab('smart')} disabled={!isAiEnabled} />
        </nav>
      </div>
      <div className="p-4 flex-grow overflow-y-auto">
        {activeTab === 'correction' && <CorrectionDoseTab currentUser={currentUser} t={t} language={language} />}
        {activeTab === 'carb' && <CarbCalculatorTab currentUser={currentUser} isAiEnabled={isAiEnabled} t={t} language={language} />}
        {activeTab === 'smart' && <SmartDoseTab currentUser={currentUser} isAiEnabled={isAiEnabled} t={t} language={language} />}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ title: string; isActive: boolean; onClick: () => void; disabled?: boolean }> = ({ title, isActive, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors duration-200 ${
      isActive
        ? 'border-primary-500 text-primary-600 dark:text-primary-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {title}
  </button>
);

const CorrectionDoseTab: React.FC<{ currentUser: User, t: (key: keyof typeof strings.fa) => string; language: Language }> = ({ currentUser, t, language }) => {
    const [currentGlucose, setCurrentGlucose] = useState('');
    const [targetGlucose, setTargetGlucose] = useState('120');
    const [result, setResult] = useState<{ dose: number | null, message: string, warnings: string[] } | null>(null);

    const { isf } = calculateInsulinFactors(currentUser);

    useEffect(() => {
        const fifteenMinutesAgo = new Date().getTime() - (15 * 60 * 1000);
        const recentBgLog = currentUser.logs
            .filter(l => l.type === 'bloodSugar' && l.glucose && l.timestamp.getTime() > fifteenMinutesAgo)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

        if (recentBgLog && recentBgLog.glucose) {
            setCurrentGlucose(toEnglishNum(recentBgLog.glucose));
        }
    }, [currentUser.logs]);

    const handleCalculate = () => {
        const currentBG = parseInt(toEnglishNum(currentGlucose), 10);
        const targetBG = parseInt(toEnglishNum(targetGlucose), 10);

        if (isNaN(currentBG) || isNaN(targetBG) || currentBG <= 0 || targetBG <= 0) {
            setResult({ dose: null, message: 'Please enter valid current and target blood glucose values.', warnings: [] });
            return;
        }
        if (isf <= 0) {
            setResult({ dose: null, message: 'Insulin Sensitivity Factor (ISF) cannot be calculated. Please complete your insulin information in your profile.', warnings: [] });
            return;
        }
        if (currentBG < targetBG) {
            setResult({ dose: null, message: 'Your current blood glucose is lower than the target. No correction dose is needed.', warnings: [] });
            return;
        }
        if (currentBG < 230) {
            setResult({ dose: null, message: 'Your blood glucose is below 230. A correction dose may risk hypoglycemia.', warnings: ['It is recommended to manage your blood sugar by drinking water and taking a short walk.'] });
            return;
        }
        
        const calculatedDose = (currentBG - targetBG) / isf;
        const finalDose = Math.round(calculatedDose);

        const warnings: string[] = [];
        const fourHoursAgo = new Date().getTime() - (4 * 60 * 60 * 1000);
        const recentBolusLogs = currentUser.logs.filter(l => l.timestamp.getTime() > fourHoursAgo && ((l.type === 'meal' && l.insulinDose) || (l.type === 'insulin' && l.insulinType === 'bolus')));
        if (recentBolusLogs.length > 0) warnings.push("Active Insulin (IOB): Use caution due to insulin injected in the last 4 hours.");
        
        const threeHoursAgo = new Date().getTime() - (3 * 60 * 60 * 1000);
        if (currentUser.logs.some(l => l.type === 'activity' && l.timestamp.getTime() > threeHoursAgo)) warnings.push("Recent Physical Activity: Exercise can increase insulin sensitivity.");

        setResult({ dose: finalDose, message: `Suggested correction dose:`, warnings });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 gap-4">
                <InputWithLabel id="currentGlucose" label={t('currentGlucose')} value={currentGlucose} onChange={setCurrentGlucose} placeholder="250" />
                <InputWithLabel id="targetGlucose" label={t('targetGlucose')} value={targetGlucose} onChange={setTargetGlucose} placeholder="120" />
            </div>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">ISF: <strong className="text-primary-600 dark:text-primary-400">{toPersianNum(isf > 0 ? isf.toFixed(1) : '—', language)}</strong></p>
            <button onClick={handleCalculate} className="w-full my-4 bg-primary-600 text-white p-3 rounded-lg shadow-md hover:bg-primary-700 transition-all duration-200 font-bold text-lg">{t('calculate')}</button>
            <ResultBox result={result} unit={t('unit')} language={language} />
            <p className="mt-auto pt-3 text-xs text-gray-500 dark:text-gray-400">{t('calculatorDisclaimer')}</p>
        </div>
    );
};

const CarbCalculatorTab: React.FC<{ currentUser: User, isAiEnabled: boolean, t: (key: keyof typeof strings.fa) => string; language: Language; }> = ({ currentUser, isAiEnabled, t, language }) => {
    const [calcMode, setCalcMode] = useState<'carb' | 'energy'>('carb');
    const [foodName, setFoodName] = useState('');
    const [carbs, setCarbs] = useState('');
    const [fat, setFat] = useState('');
    const [totalEnergy, setTotalEnergy] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { icr } = calculateInsulinFactors(currentUser);
    const ff = icr > 0 ? (15 / icr) : 0;

    const handleFoodLookup = async () => {
        if (!foodName.trim() || !isAiEnabled) return;
        setIsLoading(true);
        const result = await getCarbInfoForFood(foodName.trim());
        if (result && typeof result.carbsPer100g === 'number') {
            setCarbs(String(Math.round(result.carbsPer100g)));
        } else {
            alert('Sorry, no information was found for this food item.');
        }
        setIsLoading(false);
    };
    
    let carbUnit = 0;
    if (calcMode === 'carb') {
        const numCarbs = parseFloat(toEnglishNum(carbs)) || 0;
        if (numCarbs > 0) carbUnit = numCarbs / 15;
    } else { // energy mode
        const numEnergy = parseFloat(toEnglishNum(totalEnergy)) || 0;
        const numFat = parseFloat(toEnglishNum(fat)) || 0;
        if (numEnergy > 0) {
            const nonFatCalories = numEnergy - (numFat * 9);
            if (nonFatCalories > 0) {
                carbUnit = nonFatCalories / 60;
            }
        }
    }
    const insulinDose = ff > 0 ? carbUnit * ff : 0;

    return (
        <div className="space-y-4">
             <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                <button onClick={() => setCalcMode('carb')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${calcMode === 'carb' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('byCarb')}</button>
                <button onClick={() => setCalcMode('energy')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${calcMode === 'energy' ? 'bg-white dark:bg-gray-800 text-primary-600 shadow' : 'text-gray-600 dark:text-gray-300'}`}>{t('byEnergy')}</button>
            </div>

            {calcMode === 'carb' && (
                 <div>
                    <label htmlFor="foodName" className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1 block">{t('smartCarbSearch')}</label>
                    <div className="flex gap-2">
                        <input id="foodName" type="text" value={foodName} onChange={e => setFoodName(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-600" placeholder={isAiEnabled ? `${t('example')}: 100g rice` : "AI Search disabled"} disabled={!isAiEnabled} />
                        <button onClick={handleFoodLookup} disabled={isLoading || !isAiEnabled} className="px-3 bg-primary-600 text-white rounded-lg shadow-sm hover:bg-primary-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isLoading ? '...' : t('search')}
                        </button>
                    </div>
                </div>
            )}
           
            {calcMode === 'carb' ? (
                <InputWithLabel id="carbs" label={`${t('totalCarbs')} (${t('gram')})`} value={carbs} onChange={setCarbs} />
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <InputWithLabel id="totalEnergy" label={t('totalEnergy')} value={totalEnergy} onChange={setTotalEnergy} />
                    <InputWithLabel id="fat" label={`${t('fatGrams')}`} value={fat} onChange={setFat} />
                </div>
            )}

            {carbUnit > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-2 text-center border dark:border-gray-600">
                    <ResultRow label={t('carbUnit')} value={`${toPersianNum(carbUnit.toFixed(1), language)} ${t('unit')}`} />
                    <ResultRow label={t('requiredInsulin')} value={ff > 0 ? `${toPersianNum(insulinDose.toFixed(1), language)} ${t('unit')}` : 'FF unknown'} />
                </div>
            )}
        </div>
    );
};

const SmartDoseTab: React.FC<{ currentUser: User, isAiEnabled: boolean, t: (key: keyof typeof strings.fa) => string; language: Language; }> = ({ currentUser, isAiEnabled, t, language }) => {
    const [carbs, setCarbs] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ suggestedDose: number; reasoning: string } | null>(null);
    
    if (!isAiEnabled) {
        return (
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <GeminiIcon className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">AI Feature Disabled</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">To use this section, please enable the AI Assistant from the Settings menu.</p>
            </div>
        );
    }

    const handleCalculate = async () => {
        const numCarbs = parseInt(toEnglishNum(carbs), 10);
        if (isNaN(numCarbs) || numCarbs <= 0) {
            alert('Please enter a valid carbohydrate amount.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        const suggestion = await getSmartBolusSuggestion(currentUser, numCarbs, description);
        setResult(suggestion);
        setIsLoading(false);
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('smartDoseDesc')}</p>
            <InputWithLabel id="smartCarbs" label={`${t('totalCarbs')} (${t('gram')})`} value={carbs} onChange={setCarbs} />
            <div>
                <label htmlFor="smartDescription" className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1 block">{t('description')} ({t('optional')})</label>
                <input id="smartDescription" type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700" placeholder={`${t('example')}: Fatty pizza, salad`} />
            </div>
            <button onClick={handleCalculate} disabled={isLoading} className="w-full bg-primary-600 text-white p-3 rounded-lg shadow-md hover:bg-primary-700 transition-all duration-200 font-bold text-lg disabled:bg-gray-400">
                {isLoading ? t('analyzing') : t('getSmartDose')}
            </button>
            {result && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3">
                    <p className="text-center">
                        <span className="text-base font-semibold">{t('suggestedSmartDose')}:</span>
                        <span className="block text-4xl font-bold text-green-600 dark:text-green-400 my-1">{toPersianNum(result.suggestedDose, language)} <span className="text-xl">{t('unit')}</span></span>
                    </p>
                    <div className="flex items-start p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                       <GeminiIcon isActive className="h-5 w-5 mt-0.5 flex-shrink-0" />
                       <p className="ltr:ml-2 rtl:mr-2 text-sm text-indigo-800 dark:text-indigo-200">{result.reasoning}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const InputWithLabel: React.FC<{ id: string; label: string; value: string; onChange: (val: string) => void; placeholder?: string }> = ({ id, label, value, onChange, placeholder }) => (
    <div>
        <label htmlFor={id} className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-1 block">{label}</label>
        <input id={id} type="number" value={value} onChange={e => onChange(e.target.value)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center text-xl font-bold" placeholder={placeholder} />
    </div>
);

const ResultBox: React.FC<{ result: { dose: number | null, message: string, warnings: string[] } | null, unit: string, language: Language }> = ({ result, unit, language }) => (
    <div className="flex-grow flex flex-col justify-center bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl min-h-[150px]">
        {result ? (
            <div className="text-center">
                <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{result.message}</p>
                {result.dose !== null && result.dose >= 0 && <p className="text-5xl font-bold text-green-600 dark:text-green-400 my-1">{toPersianNum(result.dose, language)} <span className="text-2xl">{unit}</span></p>}
                {result.warnings.length > 0 && (
                    <div className="mt-2 text-left rtl:text-right space-y-1">
                        {result.warnings.map((warning, index) => (
                            <div key={index} className="flex items-start p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                                <LightbulbIcon />
                                <p className="ltr:ml-2 rtl:mr-2 text-xs text-yellow-800 dark:text-yellow-200">{warning}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ) : (
            <p className="text-center text-gray-400 dark:text-gray-500">Enter values and press calculate.</p>
        )}
    </div>
);

const ResultRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
        <span className="font-bold text-gray-800 dark:text-gray-100">{value}</span>
    </div>
);

export default CorrectionDoseCalculator;
