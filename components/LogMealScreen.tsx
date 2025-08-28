
import React, { useState, useEffect, useRef } from 'react';
import type { View, LogEntry, MealType, InjectionSite, Language } from '../types';
import Header from './Header';
import { CameraIcon } from './Icons';
import { getCarbsFromImageWithGemini } from '../services/geminiService';
import type { strings } from '../localization/strings';
import type dynamicStrings from '../localization/dynamicStrings';

const getTodayJalali = () => new Date().toLocaleDateString('fa-IR-u-nu-latn', {year: 'numeric', month: '2-digit', day: '2-digit'});
const getCurrentTime = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const CameraModal = ({ onClose, onCapture, isAnalyzing, t }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    useEffect(() => {
        let stream: MediaStream;
        const startCamera = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setPermissionError(t('cameraUnsupported'));
                    return;
                }
                
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setPermissionError(null); // Clear any previous error
                }
            } catch (err) {
                console.error("Error accessing camera:", err.name, err.message);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                     setPermissionError(t('permissionDenied'));
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                     setPermissionError(t('cameraNotFound'));
                } else {
                     setPermissionError(t('cameraGenericError'));
                }
            }
        };
        startCamera();
        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            onCapture(dataUrl.split(',')[1]); // Send base64 part only
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-40 flex flex-col items-center justify-center">
            {permissionError ? (
                <div className="text-white text-center p-8">
                    <p className="text-lg font-semibold">{t('cameraErrorTitle')}</p>
                    <p className="mt-2">{permissionError}</p>
                    <button onClick={onClose} className="mt-6 px-4 py-2 bg-primary-600 rounded-lg">{t('gotIt')}</button>
                </div>
            ) : (
                <>
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex justify-around items-center">
                        <button onClick={onClose} className="text-white text-sm font-semibold">{t('cancel')}</button>
                        <button onClick={handleCapture} disabled={isAnalyzing} className="w-20 h-20 bg-white rounded-full border-4 border-gray-400 disabled:opacity-50 flex items-center justify-center">
                            {isAnalyzing && <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>}
                        </button>
                        <div className="w-12"></div>
                    </div>
                </>
            )}
        </div>
    );
};

interface LogMealProps {
  onSave: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  setView: (view: View, payload?: any) => void;
  editingLog: LogEntry | null;
  onDone: () => void;
  viewPayload?: { startWithCamera?: boolean };
  isAiEnabled: boolean;
  t: (key: keyof typeof strings.fa) => string;
  dynamicT: typeof dynamicStrings.fa;
  language: Language;
}

const LogMealScreen: React.FC<LogMealProps> = ({ onSave, setView, editingLog, onDone, viewPayload, isAiEnabled, t, dynamicT, language }) => {
  const isEditing = !!editingLog;
  
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [mealType, setMealType] = useState<MealType>('lunch');
  const [description, setDescription] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fatty, setFatty] = useState(false);
  const [insulinDose, setInsulinDose] = useState('');
  const [postMealActivity, setPostMealActivity] = useState('');
  const [jalaliDate, setJalaliDate] = useState('');
  const [time, setTime] = useState(getCurrentTime());
  const [injectionSite, setInjectionSite] = useState<InjectionSite>('abdomen');

  const siteNames = (['abdomen', 'arm', 'leg', 'buttocks'] as InjectionSite[]).reduce((acc, site) => {
    acc[site] = dynamicT.getInjectionSiteName(site);
    return acc;
  }, {} as Record<InjectionSite, string>);
  
  const mealTypeOptions: {value: MealType, label: string}[] = [
    { value: 'breakfast', label: dynamicT.getMealTypeName('breakfast') },
    { value: 'morning_snack', label: dynamicT.getMealTypeName('morning_snack') },
    { value: 'lunch', label: dynamicT.getMealTypeName('lunch') },
    { value: 'afternoon_snack', label: dynamicT.getMealTypeName('afternoon_snack') },
    { value: 'dinner', label: dynamicT.getMealTypeName('dinner') },
    { value: 'night_snack', label: dynamicT.getMealTypeName('night_snack') },
  ];

  useEffect(() => {
    if (viewPayload?.startWithCamera) {
      setIsCameraOpen(true);
    }
  }, [viewPayload]);

  useEffect(() => {
    if (editingLog) {
      setMealType(editingLog.mealType || 'lunch');
      setDescription(editingLog.description || '');
      setCarbs(editingLog.carbs || '');
      setFatty(editingLog.fatty || false);
      setInsulinDose(editingLog.insulinDose || '');
      setPostMealActivity(editingLog.postMealActivity || '');
      setJalaliDate(editingLog.jalaliDate);
      setTime(editingLog.time);
      setInjectionSite(editingLog.injectionSite || 'abdomen');
    } else {
      setMealType('lunch'); setDescription(''); setCarbs(''); setFatty(false); setInsulinDose('');
      setPostMealActivity(''); setTime(getCurrentTime()); setJalaliDate(getTodayJalali()); setInjectionSite('abdomen');
    }
  }, [editingLog]);
  
  const handleCaptureAndAnalyze = async (base64Image: string) => {
    setIsAnalyzing(true);
    const result = await getCarbsFromImageWithGemini(base64Image);
    if (result) {
        setCarbs(String(Math.round(result.estimatedCarbs)));
        setDescription(result.foodDescription);
    } else {
        alert("AI could not analyze the food. Please try again or enter the values manually.");
    }
    setIsAnalyzing(false);
    setIsCameraOpen(false);
  };

  const handleSubmit = () => {
    if (carbs && jalaliDate && time) {
      onSave({ type: 'meal', carbs, fatty, insulinDose, injectionSite: insulinDose ? injectionSite : undefined, postMealActivity, mealType, description, jalaliDate, time });
      onDone();
      requestAnimationFrame(() => setView(isEditing ? 'logHistory' : 'dashboard'));
    } else {
      alert(t('requiredFields'));
    }
  };

  const handleBack = () => {
    onDone();
    requestAnimationFrame(() => setView(isEditing ? 'logHistory' : 'dashboard'));
  }

  return (
    <>
      {isCameraOpen && <CameraModal onClose={() => setIsCameraOpen(false)} onCapture={handleCaptureAndAnalyze} isAnalyzing={isAnalyzing} t={t} />}
      <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
        <Header title={isEditing ? t('editMealTitle') : t('logMealTitle')} onBack={handleBack} />
        <div className="p-4 flex-grow overflow-y-auto no-scrollbar">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
            <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                  <label htmlFor="mealType" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('mealType')}</label>
                  <select id="mealType" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                    {mealTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
              </div>

              <div className="relative">
                <label htmlFor="carbs" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('totalCarbsGrams')}</label>
                <input id="carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                {isAiEnabled && (
                    <button type="button" onClick={() => setIsCameraOpen(true)} className="absolute ltr:right-2 rtl:left-2 top-9 p-1.5 bg-gray-200 dark:bg-gray-600 rounded-full text-primary-600 dark:text-primary-300 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                        <CameraIcon className="h-5 w-5" />
                    </button>
                )}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="description" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('description')} ({t('optional')})</label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" rows={2}></textarea>
              </div>
               <div>
                <label htmlFor="insulinDose" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('injectedInsulin')} ({t('optional')})</label>
                <input id="insulinDose" type="number" value={insulinDose} onChange={(e) => setInsulinDose(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              
              {insulinDose && (
                  <div className="md:col-span-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400 mb-2 block">{t('injectionSite')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['abdomen', 'arm', 'leg', 'buttocks'] as InjectionSite[]).map((site) => (
                          <button key={site} type="button" onClick={() => setInjectionSite(site)} className={`w-full text-center py-2 px-2 rounded-lg transition-colors duration-200 font-semibold text-sm ${injectionSite === site ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500'}`}>
                              {siteNames[site]}
                          </button>
                      ))}
                      </div>
                  </div>
              )}

              <div>
                <label htmlFor="postMealActivity" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('postMealActivity')} ({t('optional')})</label>
                <input id="postMealActivity" type="text" value={postMealActivity} onChange={(e) => setPostMealActivity(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder={`${t('example')}: 10 ${t('minute')} walk`} />
              </div>
              
              <div className="md:col-span-2 flex items-center space-x-2 rtl:space-x-reverse py-2">
                  <input type="checkbox" id="fatty" checked={fatty} onChange={(e) => setFatty(e.target.checked)} className="w-4 h-4 text-primary-600 bg-gray-100 rounded border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                  <label htmlFor="fatty" className="text-sm font-medium text-gray-900 dark:text-gray-300">{t('fattyMeal')}</label>
              </div>

              <div>
                <label htmlFor="date" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('date')}</label>
                <input id="date" type="text" value={jalaliDate} onChange={(e) => setJalaliDate(e.target.value)} placeholder={`${t('example')}: ۱۴۰۳/۰۵/۰۳`} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label htmlFor="time" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('time')}</label>
                <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
            </form>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-inner">
          <div className="w-full">
            <button onClick={handleSubmit} className="w-full bg-primary-600 text-white p-3 rounded-lg shadow-md hover:bg-primary-700 transition-all duration-200 font-semibold">
              {isEditing ? t('saveChanges') : t('submit')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogMealScreen;