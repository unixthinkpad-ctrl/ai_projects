import React from 'react';
import { Language, LanguageOption } from '../types';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
  options: LanguageOption[];
  label: string;
  className?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
  options,
  label,
  className = '',
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onLanguageChange(event.target.value as Language);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={handleChange}
        className="block w-full px-4 py-2 border border-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-800 text-gray-100 transition-colors duration-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;