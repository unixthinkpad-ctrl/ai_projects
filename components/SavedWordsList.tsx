import React from 'react';
import Button from './Button';
import { Language, SavedWord } from '../types';

interface SavedWordsListProps {
  savedWords: SavedWord[];
  onTermClick: (term: string, sourceLang: Language, targetLang: Language) => void; // Changed from onWordClick
  onRemoveWord: (term: string, sourceLang: Language) => void; // Changed from onRemoveWord
}

const SavedWordsList: React.FC<SavedWordsListProps> = ({ savedWords, onTermClick, onRemoveWord }) => { // Changed onWordClick to onTermClick
  if (savedWords.length === 0) {
    return (
      <div className="text-center text-gray-400 italic p-5 bg-gray-700 rounded-xl border border-gray-600 transition-colors duration-300">
        No terms saved yet. Click a word or highlight a phrase and then save it to start your vocabulary list!
      </div>
    );
  }

  return (
    <div className="p-7 bg-gray-900 rounded-2xl shadow-md border border-indigo-900 transition-colors duration-300">
      <h3 className="text-2xl font-bold text-indigo-300 mb-5">Saved Vocabulary:</h3>
      <ul className="space-y-4">
        {savedWords.map((savedWord) => (
          <li
            key={`${savedWord.term}-${savedWord.sourceLanguage}`} // Changed from savedWord.word
            className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl shadow-sm border border-indigo-900 transition-colors duration-300"
          >
            <div className="flex-grow">
              <button
                onClick={() => onTermClick(savedWord.term, savedWord.sourceLanguage, savedWord.targetLanguage)} // Changed from savedWord.word
                className="text-lg font-medium text-emerald-400 hover:text-emerald-300 underline decoration-emerald-600 decoration-2 hover:decoration-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-300 rounded-sm px-0.5 py-0 transition-colors duration-300"
                aria-label={`View details for ${savedWord.term}`} // Changed from savedWord.word
              >
                {savedWord.term}
              </button>
              <p className="text-sm text-gray-400 truncate">{savedWord.details.definition}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveWord(savedWord.term, savedWord.sourceLanguage)} // Changed from savedWord.word
              className="ml-4 bg-red-800 text-red-300 border-red-700 hover:bg-red-700 hover:text-red-200 focus:ring-red-500"
              aria-label={`Remove ${savedWord.term}`} // Changed from savedWord.word
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SavedWordsList;