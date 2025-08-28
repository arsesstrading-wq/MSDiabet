


import React, { useState } from 'react';
import type { View } from '../types';
import Header from './Header';
import { FOOD_DATABASE } from '../constants/foodData';
import type { strings } from '../localization/strings';

interface CarbTableScreenProps {
  setView: (view: View) => void;
  t: (key: keyof typeof strings.fa) => string;
}

const CarbTableScreen: React.FC<CarbTableScreenProps> = ({ setView, t }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFoods = FOOD_DATABASE.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name, 'fa'));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
      <Header 
        title={t('carbTableTitle')}
        onBack={() => setView('tools')} 
      />
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col flex-grow overflow-hidden">
        <div className="mb-4">
           <input
            type="text"
            placeholder={t('search') + '...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex justify-between items-center pb-2 border-b-2 border-gray-200 dark:border-gray-600 mb-2 flex-shrink-0">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 w-2/3">ماده غذایی</h3>
            <h3 className="font-bold text-gray-700 dark:text-gray-300 w-1/3 text-left rtl:text-right">کربوهیدرات (در ۱۰۰ گرم)</h3>
        </div>

        <div className="flex-grow overflow-y-auto no-scrollbar">
            {filteredFoods.length > 0 ? (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredFoods.map((food) => (
                        <li key={food.name} className="py-3 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-2/3">{food.name}</span>
                            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 w-1/3 text-left rtl:text-right">{food.carbsPer100g} گرم</span>
                        </li>
                    ))}
                </ul>
            ) : (
                 <div className="text-center py-10 px-4">
                    <p className="text-gray-500 dark:text-gray-400">ماده غذایی مورد نظر یافت نشد.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default CarbTableScreen;