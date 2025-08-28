



import React, { useState, useEffect, useRef } from 'react';
import type { User, View, MealType, Profile, Language } from '../types';
import Header from './Header';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DocumentTextIcon } from './Icons';
import type { strings } from '../localization/strings';
import type dynamicStrings from '../localization/dynamicStrings';
import { toPersianNum, toEnglishNum } from '../utils';

interface GraphProps {
  currentUser: User;
  setView: (view: View) => void;
  isDarkMode: boolean;
  t: (key: keyof typeof strings.fa) => string;
  dynamicT: typeof dynamicStrings.fa;
  language: Language;
}

const GLUCOSE_RANGES = { LOW: 70, HIGH: 180 };

const calculateTIR = (logs: User['logs']) => {
    const sortedBgLogs = logs
        .filter(log => log.type === 'bloodSugar' && log.glucose)
        .map(log => ({ ...log, glucose: parseInt(toEnglishNum(log.glucose!), 10), timestamp: new Date(log.timestamp) }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (sortedBgLogs.length < 2) {
        return { low: 0, normal: 0, high: 0, data: [] };
    }

    let durations = { low: 0, normal: 0, high: 0 }; // in milliseconds
    
    // We assume the glucose level is constant between two measurements
    for (let i = 0; i < sortedBgLogs.length - 1; i++) {
        const currentLog = sortedBgLogs[i];
        const nextLog = sortedBgLogs[i+1];
        const timeDiff = nextLog.timestamp.getTime() - currentLog.timestamp.getTime();
        
        // Cap duration at 4 hours to avoid over-weighting long gaps
        const cappedTimeDiff = Math.min(timeDiff, 4 * 60 * 60 * 1000);

        if (currentLog.glucose < GLUCOSE_RANGES.LOW) {
            durations.low += cappedTimeDiff;
        } else if (currentLog.glucose > GLUCOSE_RANGES.HIGH) {
            durations.high += cappedTimeDiff;
        } else {
            durations.normal += cappedTimeDiff;
        }
    }
    
    const totalDuration = durations.low + durations.normal + durations.high;
    if (totalDuration === 0) return { low: 0, normal: 0, high: 0, data: [] };

    const percentages = {
        low: Math.round((durations.low / totalDuration) * 100),
        normal: Math.round((durations.normal / totalDuration) * 100),
        high: Math.round((durations.high / totalDuration) * 100),
    };

    return { ...percentages };
};


const TIRChart = ({ data, isDarkMode, language, t }) => (
    <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <XAxis type="number" hide={true} domain={[0, 100]} />
            <YAxis type="category" dataKey="name" hide={true} />
            <Tooltip
                contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: '8px' }}
                formatter={(value) => {
                    const singleValue = Array.isArray(value) ? value[0] : value;
                    return [`${toPersianNum(singleValue, language)}%`, ''];
                }}
            />
            <Bar dataKey="value" stackId="a" background={{ fill: isDarkMode ? '#374151' : '#e5e7eb' }} radius={[8, 8, 8, 8]}>
            </Bar>
        </BarChart>
    </ResponsiveContainer>
);

const GraphScreen: React.FC<GraphProps> = ({ currentUser, setView, isDarkMode, t, dynamicT, language }) => {
  const [isClient, setIsClient] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const bloodSugarLogs = currentUser.logs
    .filter(log => log.type === 'bloodSugar' && log.glucose)
    .map(log => ({
      time: toPersianNum(log.time, language),
      date: toPersianNum(log.jalaliDate, language),
      glucose: parseInt(toEnglishNum(log.glucose!), 10),
      timestamp: log.timestamp,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
  const tirPercentages = calculateTIR(currentUser.logs);
  const tirData = [
      { name: t('low'), value: tirPercentages.low, fill: '#ef4444' }, // red-500
      { name: t('normal'), value: tirPercentages.normal, fill: '#22c55e' }, // green-500
      { name: t('high'), value: tirPercentages.high, fill: '#f59e0b' }, // amber-500
  ];

  const exportChart = (format: 'jpg' | 'pdf') => {
    if (chartRef.current) {
      setIsExporting(format);
      html2canvas(chartRef.current, { useCORS: true, backgroundColor: isDarkMode ? '#1f2937' : '#ffffff' }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const fileName = `royaye-shirin-report-${new Date().toISOString().slice(0, 10)}.jpg`;

        if (format === 'jpg') {
          const link = document.createElement('a');
          link.href = imgData;
          link.download = fileName;
          link.click();
        } else {
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(fileName.replace('.jpg', '.pdf'));
        }
        setIsExporting(null);
      });
    }
  };
  
  const exportToCsv = () => {
    const headers = ['Date', 'Time', 'Type', 'Value', 'Carbs (g)', 'Insulin', 'Description'];
    const sortedLogs = [...currentUser.logs].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const rows = sortedLogs.map(log => {
        let row: (string | undefined)[] = [log.jalaliDate, log.time];
        switch(log.type) {
            case 'bloodSugar': row.push('Blood Sugar', log.glucose, '', '', ''); break;
            case 'meal': row.push(dynamicT.getMealTypeName(log.mealType), '', log.carbs, log.insulinDose, log.description); break;
            case 'activity': row.push('Activity', log.duration, '', '', log.activityType); break;
            case 'sleep': row.push('Sleep', `${log.sleepTime}-${log.time}`, '', '', ''); break;
            case 'insulin': row.push(`Insulin ${log.insulinType}`, log.insulinDose, '', '', ''); break;
            case 'mood': row.push('Mood', Array.isArray(log.mood) ? log.mood.join(', ') : '', '', '', log.description); break;
            case 'medication': row.push('Medication', `${log.medicationDose || ''} ${log.medicationUnit || ''}`, '', '', log.medicationName); break;
            case 'physicalCondition': row.push('Physical Condition', Array.isArray(log.condition) ? log.condition.join(', ') : '', '', '', log.description); break;
        }
        return row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',');
    });
    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `royaye-shirin-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  const yAxisTickFormatter = (value) => toPersianNum(value, language);

  return (
    <>
      {isExporting && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="text-white text-lg">{t('preparingReport')}</div></div>}
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
        <Header title={t('graphTitle')} onBack={() => setView('tools')} />
        <div className="p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto no-scrollbar">
          <div className="w-full">
            {/* TIR Chart Section */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-md border border-gray-300 dark:border-gray-600 mb-6">
              <h3 className="text-lg font-bold mb-2">{t('timeInRange')}</h3>
              {isClient && tirData.some(d => d.value > 0) ? (
                <>
                  <TIRChart data={tirData} isDarkMode={isDarkMode} language={language} t={t} />
                  <div className="flex justify-around text-center text-xs mt-2">
                    <div><span className="font-bold text-red-500">{toPersianNum(tirPercentages.low, language)}%</span> {t('low')}</div>
                    <div><span className="font-bold text-green-500">{toPersianNum(tirPercentages.normal, language)}%</span> {t('normal')}</div>
                    <div><span className="font-bold text-amber-500">{toPersianNum(tirPercentages.high, language)}%</span> {t('high')}</div>
                  </div>
                </>
              ) : <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('noTIRData')}</p>}
            </div>

            {/* Glucose Chart Section */}
            <div ref={chartRef} className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-md border border-gray-300 dark:border-gray-600 h-80 md:h-96">
              <h3 className="text-lg font-bold mb-2">{t('glucoseChart')}</h3>
              {isClient && bloodSugarLogs.length > 1 ? (
                <ResponsiveContainer width="100%" height="calc(100% - 30px)" debounce={1}>
                  <LineChart data={bloodSugarLogs} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'} />
                    <XAxis dataKey="time" tick={{ fill: isDarkMode ? '#d1d5db' : '#374151' }} />
                    <YAxis domain={[40, 300]} tick={{ fill: isDarkMode ? '#d1d5db' : '#374151' }} tickFormatter={yAxisTickFormatter} />
                    <Tooltip contentStyle={{ backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)', borderColor: isDarkMode ? '#4b5563' : '#d1d5db', color: isDarkMode ? '#f9fafb' : '#111827', borderRadius: '8px' }} labelStyle={{ color: isDarkMode ? '#f9fafb' : '#111827' }} labelFormatter={(label) => `${t('time')}: ${label}`} formatter={(value, name, props) => {
                        const singleValue = Array.isArray(value) ? value[0] : value;
                        return [`${toPersianNum(singleValue, language)} mg/dL`, `${t('logMenuBloodSugar')} (${props.payload.date})`]
                    }} />
                    <Legend formatter={() => <span className="text-gray-800 dark:text-gray-100">{t('logMenuBloodSugar')}</span>} />
                    <Line type="monotone" dataKey="glucose" stroke="var(--color-primary-600-val)" strokeWidth={2} activeDot={{ r: 8 }} dot={{fill: 'var(--color-primary-400-val)'}} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <div className="flex items-center justify-center h-full"><p className="text-gray-500 dark:text-gray-400">{isClient ? t('noChartData') : t('loadingChart')}</p></div>}
            </div>

            {/* Export Section */}
            <div className="mt-8 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
                <h3 className="text-xl font-bold mb-4">{t('exports')}</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => exportChart('pdf')} className="w-full text-center py-3 px-4 rounded-lg transition-colors duration-200 bg-red-600 text-white hover:bg-red-700 shadow-md font-semibold">{t('chartPDF')}</button>
                    <button onClick={() => exportChart('jpg')} className="w-full text-center py-3 px-4 rounded-lg transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 shadow-md font-semibold">{t('chartJPG')}</button>
                    <button onClick={exportToCsv} className="w-full col-span-2 text-center py-3 px-4 rounded-lg transition-colors duration-200 bg-green-600 text-white hover:bg-green-700 shadow-md font-semibold">{t('excelFileCSV')}</button>
                 </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GraphScreen;