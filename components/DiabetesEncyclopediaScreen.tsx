
import React, { useState } from 'react';
import type { View } from '../types';
import Header from './Header';
import type { strings } from '../localization/strings';

interface DiabetesEncyclopediaScreenProps {
  setView: (view: View) => void;
  t: (key: keyof typeof strings.fa) => string;
}

const AccordionItem: React.FC<{ title: string; content: string; isOpen: boolean; onClick: () => void; }> = ({ title, content, isOpen, onClick }) => {
    const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
    
    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center text-left rtl:text-right p-4 focus:outline-none"
                aria-expanded={isOpen}
            >
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">{title}</h3>
                <svg
                    className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
            >
                <div className="p-4 pt-0 text-sm text-gray-600 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedContent }} />
            </div>
        </div>
    );
};

const DiabetesEncyclopediaScreen: React.FC<DiabetesEncyclopediaScreenProps> = ({ setView, t }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const encyclopediaContent = [
        { title: t('encyclopedia_what_is_diabetes_title'), content: t('encyclopedia_what_is_diabetes_content') },
        { title: t('encyclopedia_bg_management_title'), content: t('encyclopedia_bg_management_content') },
        { title: t('encyclopedia_carb_counting_title'), content: t('encyclopedia_carb_counting_content') },
        { title: t('encyclopedia_insulin_sites_title'), content: t('encyclopedia_insulin_sites_content') },
        { title: t('encyclopedia_exercise_role_title'), content: t('encyclopedia_exercise_role_content') },
        { title: t('encyclopedia_general_care_title'), content: t('encyclopedia_general_care_content') },
    ];

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
            <Header title={t('diabetesEncyclopedia')} onBack={() => setView('tools')} />
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm mb-4 border border-yellow-300 dark:border-yellow-700">
                    <p><strong>توجه:</strong> {t('encyclopediaDisclaimer')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-sm overflow-hidden">
                    {encyclopediaContent.map((item, index) => (
                        <AccordionItem
                            key={index}
                            title={item.title}
                            content={item.content}
                            isOpen={openIndex === index}
                            onClick={() => handleToggle(index)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DiabetesEncyclopediaScreen;
