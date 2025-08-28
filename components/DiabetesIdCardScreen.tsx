import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import type { View, User, Language } from '../types';
import Header from './Header';
import { MedicalAlertIcon, ProfileIconGeneric } from './Icons';
import type { strings } from '../localization/strings';
import { toPersianNum } from '../utils';

interface DiabetesIdCardScreenProps {
  setView: (view: View) => void;
  currentUser: User;
  t: (key: keyof typeof strings.fa) => string;
  language: Language;
}

const DiabetesIdCardScreen: React.FC<DiabetesIdCardScreenProps> = ({ setView, currentUser, t, language }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const getDiabetesTypeName = (type: User['profile']['diabetesType']) => {
    switch (type) {
      case 'type1': return t('type1');
      case 'type2': return t('type2');
      case 'gestational': return t('gestational');
      case 'other': return t('other');
      default: return '—';
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        backgroundColor: null, // Transparent background for the capture
      });
      const link = document.createElement('a');
      link.download = `diabetes-id-card-${currentUser.name.replace(/\s/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error("Error downloading card:", error);
      alert("Could not download the card image.");
    } finally {
      setIsDownloading(false);
    }
  };

  const CardContent = () => (
    <div ref={cardRef} className="bg-white text-gray-900 rounded-2xl shadow-lg w-full max-w-sm aspect-[85.6/54] p-3 flex flex-col border-2 border-red-500 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b-2 border-red-300 flex-shrink-0">
            <h1 className="text-sm font-bold text-red-600">{t('diabetesIdCardTitle')}</h1>
            <MedicalAlertIcon className="h-7 w-7 text-red-500" />
        </div>
        
        {/* Main Content */}
        <div className="flex-grow flex flex-col justify-between py-2 space-y-2">
            {/* Top part: Profile */}
            <div className="flex items-center gap-3">
                <div className="w-[56px] h-[56px] bg-gray-200 rounded-full flex items-center justify-center border-2 border-gray-300 overflow-hidden flex-shrink-0">
                    {currentUser.profile.photo ? (
                        <img src={currentUser.profile.photo} alt={t('photo')} className="w-full h-full object-cover" />
                    ) : (
                        <ProfileIconGeneric className="w-8 h-8 text-gray-500" />
                    )}
                </div>
                <div className="space-y-1 min-w-0">
                    <div>
                        <p className="text-[10px] text-gray-500">{t('name')}</p>
                        <p className="font-bold text-base leading-tight truncate">{currentUser.name}</p>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <div>
                            <p className="text-gray-500">{t('birthDate')}</p>
                            <p className="font-semibold leading-tight">{toPersianNum(currentUser.profile.birthDate, language) || '—'}</p>
                        </div>
                        <div className="pr-2">
                            <p className="text-gray-500">{t('diabetesType')}</p>
                            <p className="font-semibold leading-tight">{getDiabetesTypeName(currentUser.profile.diabetesType)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle part: Emergency Text */}
            <div className="bg-red-100 p-2 rounded-lg text-red-800 text-center flex-grow flex flex-col justify-center">
                <h2 className="font-bold text-xs">{t('inCaseOfEmergency')}</h2>
                <p className="text-[9px] leading-snug px-1">{t('inCaseOfEmergencyDesc')}</p>
            </div>

            {/* Bottom part: Contacts and Insulin */}
            <div className="text-xs grid grid-cols-2 gap-x-3">
                <div>
                    <p className="font-bold">{t('emergencyContacts')}:</p>
                    {currentUser.profile.emergencyContacts.length > 0 ? (
                        currentUser.profile.emergencyContacts.slice(0, 2).map(contact => (
                            <div key={contact.id} className="leading-tight text-[10px]">
                                <p className="truncate">{contact.name}</p>
                                <p className="truncate">{toPersianNum(contact.phone, language)}</p>
                            </div>
                        ))
                    ) : (
                        <p className="leading-tight text-[10px]">{t('noneDefined')}</p>
                    )}
                </div>
                <div>
                    <p className="font-bold">{t('logMenuInsulin')}:</p>
                    <p className="truncate leading-tight text-[10px]">{t('basalInsulin')}: {currentUser.profile.basalInsulin || '—'}</p>
                    <p className="truncate leading-tight text-[10px]">{t('bolusInsulin')}: {currentUser.profile.bolusInsulin || '—'}</p>
                </div>
            </div>
        </div>
    </div>
);


  return (
    <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
      <Header title={t('diabetesIdCardTool')} onBack={() => setView('tools')} />
      <div className="flex-grow p-4 flex flex-col items-center justify-center">
        <CardContent />
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="mt-6 w-full max-w-sm bg-primary-600 text-white p-3 rounded-lg shadow-md hover:bg-primary-700 transition-all duration-200 font-semibold disabled:bg-gray-400"
        >
          {isDownloading ? `${t('loading')}...` : t('downloadAsImage')}
        </button>
      </div>
    </div>
  );
};

export default DiabetesIdCardScreen;
