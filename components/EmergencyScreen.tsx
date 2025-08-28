

import React, { useState } from 'react';
import type { View, User } from '../types';
import Header from './Header';
import { EmergencyIcon } from './Icons';
import type { strings } from '../localization/strings';
import type dynamicStrings from '../localization/dynamicStrings';


interface EmergencyScreenProps {
  setView: (view: View) => void;
  currentUser: User;
  t: (key: keyof typeof strings.fa) => string;
  dynamicT: typeof dynamicStrings.fa;
}

const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ setView, currentUser, t, dynamicT }) => {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmergencyPress = () => {
    const contacts = currentUser.profile.emergencyContacts;
    if (!contacts || contacts.length === 0) {
      alert(t('addEmergencyContactFirst'));
      setView('profile');
      return;
    }

    setIsSending(true);
    setError(null);

    if (!navigator.geolocation) {
      setError(t('geolocationNotSupported'));
      setIsSending(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = dynamicT.getEmergencyMessage(currentUser.name, mapsLink);

        const phoneNumbers = contacts.map(c => c.phone).join(',');
        
        // Use the sms: protocol which opens the user's default messaging app
        const smsLink = `sms:${phoneNumbers}?&body=${encodeURIComponent(message)}`;
        
        // This will attempt to open the messaging app. The user must press send.
        window.location.href = smsLink;

        setIsSending(false);
      },
      (geoError) => {
        let errorMessage = '';
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = t('geolocationPermissionDenied');
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = t('geolocationPositionUnavailable');
            break;
          case geoError.TIMEOUT:
            errorMessage = t('geolocationTimeout');
            break;
          default:
            errorMessage = t('geolocationUnknownError');
            break;
        }
        setError(errorMessage);
        setIsSending(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="flex flex-col h-full bg-red-50 dark:bg-red-900/50 text-gray-800 dark:text-gray-100">
      <Header title={t('emergencyMode')} onBack={() => setView('tools')} />
      <div className="flex-grow p-4 flex flex-col items-center justify-center text-center">
        <EmergencyIcon className="h-24 w-24 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-red-700 dark:text-red-300">{t('emergencyAlert')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md">
          {t('emergencyModeDesc')}
        </p>
        <div className="mt-8">
            <button
                onClick={handleEmergencyPress}
                disabled={isSending}
                className="w-48 h-48 bg-red-600 text-white rounded-full flex flex-col items-center justify-center shadow-2xl animate-pulse focus:animate-none hover:animate-none active:scale-95 transition-transform duration-150"
            >
                {isSending ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                ) : (
                    <>
                        <span className="text-3xl font-bold">{t('sendAlert')}</span>
                        <span className="text-sm mt-1">{t('holdToActivate')}</span>
                    </>
                )}
            </button>
        </div>
        {error && <p className="mt-6 text-red-600 font-semibold">{error}</p>}

        <p className="mt-auto text-sm text-gray-500 dark:text-gray-500">
          {t('emergencyContacts')}: {currentUser.profile.emergencyContacts.map(c => c.name).join(', ') || t('noneDefined')}
          <button onClick={() => setView('profile')} className="text-primary-600 dark:text-primary-400 font-semibold ltr:ml-2 rtl:mr-2">{t('edit')}</button>
        </p>
      </div>
    </div>
  );
};

export default EmergencyScreen;