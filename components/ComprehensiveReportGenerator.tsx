


import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { User, LogEntry, Language, View } from '../types';
import { calculateInsulinFactors } from '../constants';
import type { strings } from '../localization/strings';
import type dynamicStrings from '../localization/dynamicStrings';
import { toPersianNum, toEnglishNum } from '../utils';
import Header from './Header';

interface ReportScreenProps {
  currentUser: User;
  isDarkMode: boolean;
  t: (key: keyof typeof strings.fa) => string;
  dynamicT: typeof dynamicStrings.fa;
  setView: (view: View) => void;
  language: Language;
}

const calculateAge = (birthDateStr?: string, lang: Language = 'fa'): string => {
    if (!birthDateStr || !birthDateStr.includes('/')) return 'N/A';
    try {
        const birthYear = parseInt(toEnglishNum(birthDateStr).split('/')[0], 10);
        const currentJalaliYearStr = new Date().toLocaleDateString('fa-IR-u-nu-latn').split('/')[0];
        const currentJalaliYear = parseInt(currentJalaliYearStr, 10);
        if (isNaN(birthYear) || isNaN(currentJalaliYear)) return 'N/A';
        const age = currentJalaliYear - birthYear;
        return age >= 0 && age < 120 ? toPersianNum(String(age), lang) : 'N/A';
    } catch { return 'N/A'; }
};

const ComprehensiveReportGenerator: React.FC<ReportScreenProps> = ({ currentUser, setView, isDarkMode, t, language }) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleDownloadPdf = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        // Wait for potential re-renders
        await new Promise(resolve => setTimeout(resolve, 50)); 
        try {
            const canvas = await html2canvas(reportRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.98);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`royaye-shirin-report-${currentUser.name.replace(/\s/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`);

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert(t('error') + ': ' + (error as Error).message);
        } finally {
            setIsExporting(false);
        }
    };
    
    // Report data calculations
    const GLUCOSE_RANGES = { LOW: 70, HIGH: 180 };
    
    const calculateTIR = (logs: LogEntry[]) => {
        const sortedBgLogs = logs
            .filter(log => log.type === 'bloodSugar' && log.glucose)
            .map(log => ({ ...log, glucose: parseInt(toEnglishNum(log.glucose!), 10), timestamp: new Date(log.timestamp) }))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        if (sortedBgLogs.length < 2) return { low: 0, normal: 0, high: 0 };

        let durations = { low: 0, normal: 0, high: 0 }; // in milliseconds
        
        for (let i = 0; i < sortedBgLogs.length - 1; i++) {
            const currentLog = sortedBgLogs[i];
            const nextLog = sortedBgLogs[i+1];
            const timeDiff = nextLog.timestamp.getTime() - currentLog.timestamp.getTime();
            const cappedTimeDiff = Math.min(timeDiff, 4 * 60 * 60 * 1000);

            if (currentLog.glucose < GLUCOSE_RANGES.LOW) durations.low += cappedTimeDiff;
            else if (currentLog.glucose > GLUCOSE_RANGES.HIGH) durations.high += cappedTimeDiff;
            else durations.normal += cappedTimeDiff;
        }
        
        const totalDuration = durations.low + durations.normal + durations.high;
        if (totalDuration === 0) return { low: 0, normal: 0, high: 0 };

        return {
            low: Math.round((durations.low / totalDuration) * 100),
            normal: Math.round((durations.normal / totalDuration) * 100),
            high: Math.round((durations.high / totalDuration) * 100),
        };
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = currentUser.logs.filter(log => new Date(log.timestamp) >= thirtyDaysAgo);

    const tirPercentages = calculateTIR(recentLogs);
    
    const bloodSugarLogs = recentLogs
        .filter(log => log.type === 'bloodSugar' && log.glucose)
        .map(log => ({
            name: `${log.jalaliDate.substring(5)}`,
            glucose: parseInt(toEnglishNum(log.glucose!), 10),
            timestamp: new Date(log.timestamp),
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const insulinFactors = calculateInsulinFactors(currentUser);
    const isf = toPersianNum(insulinFactors.isf > 0 ? insulinFactors.isf.toFixed(1) : '—', language);
    const icr = toPersianNum(insulinFactors.icr > 0 ? insulinFactors.icr.toFixed(1) : '—', language);
    const tdd = toPersianNum(insulinFactors.tdd > 0 ? insulinFactors.tdd.toFixed(1) : '—', language);
    const age = calculateAge(currentUser.profile.birthDate, language);
    const gender = currentUser.profile.gender === 'male' ? t('male') : (currentUser.profile.gender === 'female' ? t('female') : '—');


    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string | number }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 border border-gray-300 dark:border-gray-600 rounded-md text-xs shadow-lg">
                    <p className="font-semibold">{`${label}`}</p>
                    <p className="text-primary-600 dark:text-primary-400">{`${t('logMenuBloodSugar')}: ${toPersianNum(payload[0].value, language)} mg/dL`}</p>
                </div>
            );
        }
        return null;
    };
    
    const todayJalali = new Date().toLocaleDateString('fa-IR-u-nu-latn', { year: 'numeric', month: 'long', day: 'numeric' });
    const yAxisTickFormatter = (value) => toPersianNum(value, language);
    
    const ReportContent = () => (
        <div ref={reportRef} className="bg-white p-4 sm:p-6 text-black" style={{ fontFamily: 'Vazirmatn, sans-serif' }}>
            <div className="flex justify-between items-center border-b-2 border-primary-600 pb-2">
                <h1 className="text-xl sm:text-2xl font-bold text-primary-600">{t('comprehensiveDiabetesReport')}</h1>
                <span className="text-sm sm:text-base font-semibold">{t('appName')}</span>
            </div>
            
            <div className="mt-6 border border-gray-300 rounded-lg p-4">
                <h2 className="text-lg font-bold mb-2 pb-1 border-b">{t('userInfo')}</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><strong className="font-semibold">{t('name')}:</strong> {currentUser.name}</div>
                    <div><strong className="font-semibold">{t('reportDate')}:</strong> {toPersianNum(todayJalali, language)}</div>
                    <div><strong className="font-semibold">{t('birthDate')}:</strong> {toPersianNum(currentUser.profile.birthDate, language) || '—'} (Age: {age})</div>
                    <div><strong className="font-semibold">{t('gender')}:</strong> {gender}</div>
                    <div><strong className="font-semibold">TDD:</strong> {tdd} {t('unit')}</div>
                    <div><strong className="font-semibold">ISF:</strong> {isf}</div>
                    <div><strong className="font-semibold">ICR:</strong> {icr}</div>
                </div>
            </div>

            <div className="mt-6">
                <h2 className="text-lg font-bold">Time in Range (Last 30 Days)</h2>
                {tirPercentages.low + tirPercentages.normal + tirPercentages.high > 0 ? (
                    <>
                        <div className="w-full flex rounded-full overflow-hidden mt-2 h-6" style={{direction: 'ltr'}}>
                            <div title={`${t('low')}: ${toPersianNum(tirPercentages.low, language)}%`} style={{ width: `${tirPercentages.low}%` }} className="bg-red-500"></div>
                            <div title={`${t('normal')}: ${toPersianNum(tirPercentages.normal, language)}%`} style={{ width: `${tirPercentages.normal}%` }} className="bg-green-500"></div>
                            <div title={`${t('high')}: ${toPersianNum(tirPercentages.high, language)}%`} style={{ width: `${tirPercentages.high}%` }} className="bg-amber-500"></div>
                        </div>
                        <div className="flex justify-around text-xs mt-2">
                            <span><span className="text-red-500">●</span> {t('low')}: {toPersianNum(tirPercentages.low, language)}%</span>
                            <span><span className="text-green-500">●</span> {t('normal')}: {toPersianNum(tirPercentages.normal, language)}%</span>
                            <span><span className="text-amber-500">●</span> {t('high')}: {toPersianNum(tirPercentages.high, language)}%</span>
                        </div>
                    </>
                ) : <p className="text-sm text-gray-500 text-center py-4">{t('noTIRData')}</p>}
            </div>

            <div className="mt-6">
                <h2 className="text-lg font-bold">Glucose Chart (Last 30 Days)</h2>
                {bloodSugarLogs.length > 1 ? (
                    <div className="w-full h-64 mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={bloodSugarLogs} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#333' }} />
                                <YAxis domain={[40, 400]} tick={{ fontSize: 10, fill: '#333' }} tickFormatter={yAxisTickFormatter} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="glucose" stroke="#4f46e5" strokeWidth={2} dot={{ r: 2, fill: '#4f46e5' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : <div className="flex items-center justify-center h-48"><p className="text-sm text-gray-500 text-center">{t('noChartData')}</p></div>}
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
                {t('calculatorDisclaimer')}
            </div>
        </div>
    );


    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            <Header title={t('comprehensiveReportForDoctor')} onBack={() => setView('tools')} />
            
            {isExporting && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="text-white text-lg font-semibold flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('preparingReport')}...
                    </div>
                </div>
            )}

            <div className="flex-grow overflow-y-auto p-2 sm:p-4">
                 <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg mx-auto max-w-4xl text-gray-800 dark:text-gray-100">
                    {/* The ReportContent needs to be rendered with light-mode styles for the PDF */}
                    <div className="hidden"> 
                        <ReportContent />
                    </div>
                    {/* The visible content can follow the app's theme */}
                    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg">
                        <div className="flex justify-between items-center border-b-2 border-primary-600 pb-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400">{t('comprehensiveDiabetesReport')}</h1>
                            <span className="text-sm sm:text-base font-semibold">{t('appName')}</span>
                        </div>
                        <div className="mt-6 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                             <h2 className="text-lg font-bold mb-2 pb-1 border-b dark:border-gray-700">{t('userInfo')}</h2>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div><strong className="font-semibold">{t('name')}:</strong> {currentUser.name}</div>
                                <div><strong className="font-semibold">{t('reportDate')}:</strong> {toPersianNum(todayJalali, language)}</div>
                                <div><strong className="font-semibold">{t('birthDate')}:</strong> {toPersianNum(currentUser.profile.birthDate, language) || '—'} (Age: {age})</div>
                                <div><strong className="font-semibold">{t('gender')}:</strong> {gender}</div>
                                <div><strong className="font-semibold">TDD:</strong> {tdd} {t('unit')}</div>
                                <div><strong className="font-semibold">ISF:</strong> {isf}</div>
                                <div><strong className="font-semibold">ICR:</strong> {icr}</div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <h2 className="text-lg font-bold">Time in Range (Last 30 Days)</h2>
                            {tirPercentages.low + tirPercentages.normal + tirPercentages.high > 0 ? (
                                <>
                                    <div className="w-full flex rounded-full overflow-hidden mt-2 h-6" style={{direction: 'ltr'}}>
                                        <div title={`${t('low')}: ${toPersianNum(tirPercentages.low, language)}%`} style={{ width: `${tirPercentages.low}%` }} className="bg-red-500"></div>
                                        <div title={`${t('normal')}: ${toPersianNum(tirPercentages.normal, language)}%`} style={{ width: `${tirPercentages.normal}%` }} className="bg-green-500"></div>
                                        <div title={`${t('high')}: ${toPersianNum(tirPercentages.high, language)}%`} style={{ width: `${tirPercentages.high}%` }} className="bg-amber-500"></div>
                                    </div>
                                    <div className="flex justify-around text-xs mt-2">
                                        <span><span className="text-red-500">●</span> {t('low')}: {toPersianNum(tirPercentages.low, language)}%</span>
                                        <span><span className="text-green-500">●</span> {t('normal')}: {toPersianNum(tirPercentages.normal, language)}%</span>
                                        <span><span className="text-amber-500">●</span> {t('high')}: {toPersianNum(tirPercentages.high, language)}%</span>
                                    </div>
                                </>
                            ) : <p className="text-sm text-gray-500 text-center py-4">{t('noTIRData')}</p>}
                        </div>
                        <div className="mt-6">
                            <h2 className="text-lg font-bold">Glucose Chart (Last 30 Days)</h2>
                            {bloodSugarLogs.length > 1 ? (
                                <div className="w-full h-64 mt-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={bloodSugarLogs} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#4b5563' : '#e5e7eb'} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDarkMode ? '#d1d5db' : '#374151' }} />
                                            <YAxis domain={[40, 400]} tick={{ fontSize: 10, fill: isDarkMode ? '#d1d5db' : '#374151' }} tickFormatter={yAxisTickFormatter} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line type="monotone" dataKey="glucose" stroke="var(--color-primary-600-val)" strokeWidth={2} dot={{ r: 2, fill: 'var(--color-primary-600-val)' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : <div className="flex items-center justify-center h-48"><p className="text-sm text-gray-500 text-center">{t('noChartData')}</p></div>}
                        </div>

                         <div className="mt-8 pt-4 border-t border-gray-300 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
                            {t('calculatorDisclaimer')}
                        </div>
                    </div>
                 </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-inner">
                <button
                    onClick={handleDownloadPdf}
                    disabled={isExporting}
                    className="w-full bg-primary-600 text-white p-3 rounded-lg shadow-md hover:bg-primary-700 transition-all duration-200 font-semibold disabled:bg-gray-400"
                >
                    {isExporting ? t('preparingReport') : t('comprehensiveReportPDF')}
                </button>
            </div>
        </div>
    );
};

export default ComprehensiveReportGenerator;