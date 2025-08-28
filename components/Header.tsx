
import React from 'react';
import { BackIcon, SettingsIcon } from './Icons';

interface HeaderProps {
  title: string;
  onBack: () => void;
  onSettingsClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack, onSettingsClick }) => (
  <div className="p-4 sm:px-5 lg:px-6 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
    <div className="w-full flex items-center justify-between">
      <div className="flex-1 flex justify-start">
        <div className="flex items-center space-x-1 rtl:space-x-reverse">
            {onSettingsClick ? (
              <button
                onClick={onSettingsClick}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-gray-600 dark:text-gray-400"
                title="Settings"
                aria-label="Settings"
              >
                <SettingsIcon />
              </button>
            ) : (
              <div className="w-10 h-10" /> // Placeholder for balance
            )}
        </div>
      </div>
      <h2 className="text-xl font-bold flex-shrink-0 text-center px-2">{title}</h2>
      <div className="flex-1 flex justify-end">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-primary-600 dark:text-primary-400 flex items-center justify-center" aria-label="Back">
            <BackIcon className="h-6 w-6 rtl:scale-x-[-1] rotate-180" />
        </button>
      </div>
    </div>
  </div>
);

export default Header;