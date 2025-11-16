import React from 'react';

interface TextInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  className?: string;
}

const TextInput: React.FC<TextInputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      <label htmlFor="text-input" className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <textarea
        id="text-input"
        rows={6}
        className="block w-full px-4 py-2 border border-indigo-700 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-100 bg-gray-800 resize-y transition-colors duration-300"
        placeholder="Paste your text here..."
        {...props}
      />
    </div>
  );
};

export default TextInput;