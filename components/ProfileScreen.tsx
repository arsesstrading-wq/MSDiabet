

import React, { useState, useEffect, useRef } from 'react';
import type { User, View, Profile, InjectionSite, Language, EmergencyContact } from '../types';
import Header from './Header';
import { EditIcon, DeleteIcon, PlusIcon, ProfileIconGeneric } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import type { strings } from '../localization/strings';

// UserList Component (defined in the same file)
interface UserListProps {
  users: User[];
  selectedUserId: string;
  onSelect: (id: string) => void;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  t: (key: keyof typeof strings.fa) => string;
}

const UserList: React.FC<UserListProps> = ({ users, selectedUserId, onSelect, onEdit, onDelete, t }) => (
  <div>
    <ul className="space-y-3">
      {users.map((user) => (
        <li
          key={user.id}
          onClick={() => onSelect(user.id)}
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
            selectedUserId === user.id ? 'bg-primary-50 dark:bg-primary-900/50 border-2 border-primary-500' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <span className="text-base font-semibold text-gray-800 dark:text-gray-100">{user.name}</span>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(user); }}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
              title={t('edit')}
            >
              <EditIcon />
            </button>
            {users.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(user.id); }}
                className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors duration-200"
                title={t('delete')}
              >
                <DeleteIcon />
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const CameraModal = ({ onClose, onCapture, t }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);

    useEffect(() => {
        let activeStream: MediaStream;
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            .then(mediaStream => {
                activeStream = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
                setStream(mediaStream);
            })
            .catch(err => {
                console.error("Camera error:", err);
                alert(t('cameraGenericError'));
                onClose();
            });

        return () => {
            activeStream?.getTracks().forEach(track => track.stop());
        };
    }, []);

    const handleCapture = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            const size = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = 400; // Resize for smaller storage
            canvas.height = 400;
            const context = canvas.getContext('2d');
            
            // Crop to center square
            const sx = (video.videoWidth - size) / 2;
            const sy = (video.videoHeight - size) / 2;
            
            context?.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);
            
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            onCapture(dataUrl);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-black bg-opacity-50 flex justify-around items-center">
                <button onClick={onClose} className="text-white text-sm font-semibold">{t('cancel')}</button>
                <button onClick={handleCapture} className="w-20 h-20 bg-white rounded-full border-4 border-gray-400"></button>
                <div className="w-12"></div>
            </div>
        </div>
    );
};


// ProfileEditForm Component (defined in the same file)
interface ProfileEditFormProps {
    user: User;
    onSave: (editedUser: User) => void;
    onCancel: () => void;
    t: (key: keyof typeof strings.fa) => string;
    language: Language;
}
  
const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ user, onSave, onCancel, t, language }) => {
    const [editedUser, setEditedUser] = useState<User>(user);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
    const photoMenuRef = useRef<HTMLDivElement>(null);
    
    const siteNames: Record<InjectionSite, string> = language === 'fa' 
        ? { abdomen: 'شکم', arm: 'دست', leg: 'پا', buttocks: 'باسن' }
        : { abdomen: 'Abdomen', arm: 'Arm', leg: 'Leg', buttocks: 'Buttocks' };
  
    useEffect(() => {
      setEditedUser(user);
    }, [user]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (photoMenuRef.current && !photoMenuRef.current.contains(event.target as Node)) {
                setIsPhotoMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [photoMenuRef]);
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(editedUser);
    };
  
    const handleProfileChange = (key: keyof Profile, value: string | boolean | InjectionSite[] | EmergencyContact[]) => {
      setEditedUser(prev => ({
        ...prev,
        profile: { ...prev.profile, [key]: value }
      }));
    };
  
    const handleNameChange = (newName: string) => {
      setEditedUser(prev => ({ ...prev, name: newName }));
    };

    const handleContactChange = (index: number, field: 'name' | 'phone', value: string) => {
        const updatedContacts = [...editedUser.profile.emergencyContacts];
        updatedContacts[index] = { ...updatedContacts[index], [field]: value };
        handleProfileChange('emergencyContacts', updatedContacts);
    };

    const addContact = () => {
        const newContact: EmergencyContact = { id: `contact_${Date.now()}`, name: '', phone: '' };
        handleProfileChange('emergencyContacts', [...editedUser.profile.emergencyContacts, newContact]);
    };

    const removeContact = (id: string) => {
        const updatedContacts = editedUser.profile.emergencyContacts.filter(c => c.id !== id);
        handleProfileChange('emergencyContacts', updatedContacts);
    };
  
    return (
      <>
      {isCameraOpen && <CameraModal onCapture={(photo) => handleProfileChange('photo', photo)} onClose={() => setIsCameraOpen(false)} t={t} />}
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
        <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">{t('editUserTitle')} {user.name}</h3>
        <form id="profile-edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2 flex items-center gap-4">
                <div className="relative" ref={photoMenuRef}>
                    <button type="button" onClick={() => setIsPhotoMenuOpen(p => !p)} className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-primary-500 transition-colors">
                        {editedUser.profile.photo ? (
                            <img src={editedUser.profile.photo} alt={t('photo')} className="w-full h-full object-cover" />
                        ) : (
                            <ProfileIconGeneric className="w-12 h-12 text-gray-400" />
                        )}
                    </button>
                    {isPhotoMenuOpen && (
                        <div className="absolute top-0 ltr:left-full rtl:right-full ltr:ml-2 rtl:mr-2 w-40 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 z-10 animate-fade-in-down">
                            <button type="button" onClick={() => { setIsCameraOpen(true); setIsPhotoMenuOpen(false); }} className="w-full text-left rtl:text-right px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg">{editedUser.profile.photo ? t('changePhoto') : t('addPhoto')}</button>
                            {editedUser.profile.photo && <button type="button" onClick={() => { handleProfileChange('photo', ''); setIsPhotoMenuOpen(false); }} className="w-full text-left rtl:text-right px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-lg">{`${t('delete')} ${t('photo')}`}</button>}
                        </div>
                    )}
                </div>

                <div className="flex-grow">
                    <label htmlFor="name" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('name')}</label>
                    <input id="name" type="text" value={editedUser.name} onChange={(e) => handleNameChange(e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
            </div>
            <div>
                <label htmlFor="birthDate" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('birthDate')}</label>
                <input
                    id="birthDate"
                    type="text"
                    value={editedUser.profile.birthDate}
                    onChange={(e) => handleProfileChange('birthDate', e.target.value)}
                    placeholder={language === 'fa' ? 'مثال: ۱۳۷۵/۰۱/۲۰' : 'e.g., 1996/04/09'}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            <div>
                <label htmlFor="gender" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('gender')}</label>
                <select id="gender" value={editedUser.profile.gender} onChange={(e) => handleProfileChange('gender', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">{t('select')}</option>
                  <option value="male">{t('male')}</option>
                  <option value="female">{t('female')}</option>
                </select>
            </div>
             <div>
                <label htmlFor="height" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('height')}</label>
                <input id="height" type="number" value={editedUser.profile.height} onChange={(e) => handleProfileChange('height', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" min="50" max="250" />
            </div>
             <div>
                <label htmlFor="weight" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('weight')}</label>
                <input id="weight" type="number" value={editedUser.profile.weight} onChange={(e) => handleProfileChange('weight', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500" min="5" max="200" />
            </div>
            <div>
                <label htmlFor="diabetesType" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('diabetesType')}</label>
                <select id="diabetesType" value={editedUser.profile.diabetesType} onChange={(e) => handleProfileChange('diabetesType', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">{t('select')}</option>
                  <option value="type1">{t('type1')}</option>
                  <option value="type2">{t('type2')}</option>
                  <option value="gestational">{t('gestational')}</option>
                  <option value="other">{t('other')}</option>
                </select>
            </div>
             <div>
                <label htmlFor="basalInsulin" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('basalInsulin')}</label>
                <select id="basalInsulin" value={editedUser.profile.basalInsulin} onChange={(e) => handleProfileChange('basalInsulin', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">{t('select')}</option>
                  <option value="Toujeo">Toujeo</option>
                  <option value="Levemir">Levemir</option>
                  <option value="Lantus">Lantus</option>
                  <option value="Other">Other</option>
                </select>
            </div>
            <div>
                <label htmlFor="bolusInsulin" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('bolusInsulin')}</label>
                <select id="bolusInsulin" value={editedUser.profile.bolusInsulin} onChange={(e) => handleProfileChange('bolusInsulin', e.target.value)} className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">{t('select')}</option>
                  <option value="Rapidosulin">Rapidosulin</option>
                  <option value="NovoRapid">NovoRapid</option>
                  <option value="Other">Other</option>
                </select>
            </div>
            
            <div className="md:col-span-2 mt-4 border-t pt-4 dark:border-gray-600">
                <h4 className="text-lg font-semibold mb-2">{t('injectionSitePriority')}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('injectionSitePriorityDesc')}</p>
                <div className="space-y-2">
                    {editedUser.profile.injectionSitePriority.map((site, index) => (
                    <div key={site} className="flex items-center justify-between p-2 bg-gray-200 dark:bg-gray-600 rounded-md">
                        <span className="font-medium text-gray-800 dark:text-gray-100">{siteNames[site]}</span>
                        <div className="flex space-x-1 rtl:space-x-reverse">
                        <button
                            type="button"
                            onClick={() => {
                            if (index > 0) {
                                const newPriority = [...editedUser.profile.injectionSitePriority];
                                [newPriority[index - 1], newPriority[index]] = [newPriority[index], newPriority[index - 1]];
                                handleProfileChange('injectionSitePriority', newPriority);
                            }
                            }}
                            disabled={index === 0}
                            className="p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                            if (index < editedUser.profile.injectionSitePriority.length - 1) {
                                const newPriority = [...editedUser.profile.injectionSitePriority];
                                [newPriority[index + 1], newPriority[index]] = [newPriority[index], newPriority[index + 1]];
                                handleProfileChange('injectionSitePriority', newPriority);
                            }
                            }}
                            disabled={index === editedUser.profile.injectionSitePriority.length - 1}
                            className="p-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>
          
            {editedUser.profile.gender === 'female' && (
            <>
                <div className="md:col-span-2 mt-4 border-t pt-4 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t('menstrualInfo')}</p>
                </div>
                <div>
                    <label htmlFor="lastPeriodStartDate" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('lastPeriodDate')}</label>
                    <input
                        id="lastPeriodStartDate"
                        type="text"
                        value={editedUser.profile.lastPeriodStartDate || ''}
                        onChange={(e) => handleProfileChange('lastPeriodStartDate', e.target.value)}
                        placeholder={language === 'fa' ? "مثال: ۱۴۰۳/۰۵/۰۱" : "e.g., 2024/07/22"}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div>
                    <label htmlFor="cycleLength" className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">{t('cycleLength')}</label>
                    <input
                        id="cycleLength"
                        type="number"
                        value={editedUser.profile.cycleLength || ''}
                        onChange={(e) => handleProfileChange('cycleLength', e.target.value)}
                        placeholder={language === 'fa' ? "مثال: ۲۸" : "e.g., 28"}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </>
            )}

            <div className="md:col-span-2 mt-4 border-t pt-4 dark:border-gray-600">
                <h4 className="text-lg font-semibold mb-2">{t('emergencyContacts')}</h4>
                <div className="space-y-3">
                    {editedUser.profile.emergencyContacts.map((contact, index) => (
                        <div key={contact.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                            <input type="text" placeholder={t('name')} value={contact.name} onChange={(e) => handleContactChange(index, 'name', e.target.value)} className="sm:col-span-2 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
                            <input type="tel" placeholder={t('phone')} value={contact.phone} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} className="sm:col-span-2 w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800" />
                            <button type="button" onClick={() => removeContact(contact.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors duration-200">
                                <DeleteIcon />
                            </button>
                        </div>
                    ))}
                    {editedUser.profile.emergencyContacts.length < 3 && (
                        <button type="button" onClick={addContact} className="w-full mt-2 py-2 px-4 bg-gray-200 dark:bg-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">
                            {t('addEmergencyContact')}
                        </button>
                    )}
                </div>
            </div>
        </form>
      </div>
      </>
    );
};

// Main ProfileScreen Component
interface ProfileScreenProps {
  users: User[];
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  updateUser: (user: User) => void;
  addUser: () => void;
  deleteUser: (id: string) => void;
  setView: (view: View) => void;
  t: (key: keyof typeof strings.fa) => string;
  language: Language;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  users,
  selectedUserId,
  setSelectedUserId,
  updateUser,
  addUser,
  deleteUser,
  setView,
  t,
  language
}) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleSave = (editedUser: User) => {
    updateUser(editedUser);
    setEditingUser(null);
  };

  const handleCancel = () => {
    setEditingUser(null);
  };
  
  const handleSaveClick = () => {
    const form = document.getElementById('profile-edit-form');
    if(form) {
        (form as HTMLFormElement).requestSubmit();
    }
  };

  const handleDeleteRequest = (userId: string) => {
    setDeletingUserId(userId);
  };

  const handleDeleteConfirm = () => {
    if (deletingUserId) {
      deleteUser(deletingUserId);
      setDeletingUserId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header title={t('appName')} onBack={() => setView('dashboard')} onSettingsClick={() => setView('settings')} />
      <div className="p-4 sm:p-6 lg:p-8 flex-grow overflow-y-auto no-scrollbar pb-40 space-y-6">
          {editingUser ? (
            <ProfileEditForm user={editingUser} onSave={handleSave} onCancel={handleCancel} t={t} language={language} />
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-4">{t('userList')}</h3>
              <UserList
                users={users}
                selectedUserId={selectedUserId}
                onSelect={setSelectedUserId}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                t={t}
              />
            </div>
          )}
      </div>
      
      {editingUser && (
        <div className="fixed bottom-20 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-20">
            <div className="flex justify-end space-x-4 rtl:space-x-reverse max-w-5xl mx-auto px-0 sm:px-6 lg:px-8">
                <button type="button" onClick={handleCancel} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 font-semibold">
                    {t('cancel')}
                </button>
                <button type="button" onClick={handleSaveClick} className="px-6 py-2 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700 transition-colors duration-200 font-semibold">
                    {t('saveChanges')}
                </button>
            </div>
        </div>
      )}

      {deletingUserId && (
        <ConfirmationModal
          message={t('deleteUserConfirm')}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingUserId(null)}
        />
      )}
      {!editingUser && users.length < 3 && (
        <div className="fixed bottom-24 ltr:right-6 rtl:left-6 z-20">
            <button
              onClick={addUser}
              className="bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 active:scale-95 transition-all duration-200"
              aria-label={t('addUser')}
              title={t('addUser')}
            >
              <PlusIcon />
            </button>
        </div>
      )}
    </div>
  );
};
export default ProfileScreen;
