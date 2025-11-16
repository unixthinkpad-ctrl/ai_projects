import React, { useCallback, useRef } from 'react';
import { WordDetail, Language } from '../types';
import Button from './Button';
import { decode, decodeAudioData } from '../services/geminiService'; // Import audio utilities

interface WordDetailCardProps {
  term: string; // Changed from 'word' to 'term'
  details: WordDetail;
  sourceLanguage: Language;
  targetLanguage: Language;
  onSaveWord: () => void;
  isSaved: boolean;
}

const WordDetailCard: React.FC<WordDetailCardProps> = ({
  term, // Changed from 'word'
  details,
  sourceLanguage,
  targetLanguage,
  onSaveWord,
  isSaved,
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      // Fix: Use window.AudioContext directly as webkitAudioContext is deprecated
      audioContextRef.current = new window.AudioContext({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  }, []);

  const playPronunciation = useCallback(async () => {
    if (!details.audioBase64) return;

    const audioContext = getAudioContext();
    try {
      const decodedBytes = decode(details.audioBase64);
      const audioBuffer = await decodeAudioData(decodedBytes, audioContext, 24000, 1); // Assuming 24000Hz, 1 channel

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Could not play pronunciation. Please try again.');
    }
  }, [details.audioBase64, getAudioContext]);

  return (
    <div className="space-y-4">
      <h4 className="text-3xl font-bold text-indigo-400 mb-4 capitalize">{term}</h4>

      {details.definition && (
        <div>
          <h5 className="font-semibold text-lg text-gray-200">Definition:</h5>
          <p className="text-gray-300">{details.definition}</p>
        </div>
      )}

      {details.pronunciation && (
        <div className="flex items-center space-x-2">
          <h5 className="font-semibold text-lg text-gray-200">Pronunciation:</h5>
          <p className="text-gray-300 font-mono">{details.pronunciation}</p>
          {details.audioBase64 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={playPronunciation}
              className="ml-2 px-3 py-1 rounded-full bg-emerald-700 text-emerald-100 hover:bg-emerald-600 transition-colors duration-300"
              aria-label={`Play pronunciation for ${term}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.348 2.796-1.661l11.54 6.347c1.267.689 1.267 2.633 0 3.322l-11.54 6.347c-1.267.688-2.796-.233-2.796-1.66V5.653Z" clipRule="evenodd" />
              </svg>
            </Button>
          )}
        </div>
      )}

      {details.exampleSentences && details.exampleSentences.length > 0 && (
        <div>
          <h5 className="font-semibold text-lg text-gray-200">Example Sentences:</h5>
          <ul className="list-disc list-inside space-y-1">
            {details.exampleSentences.map((sentence, index) => (
              <li key={index} className="text-gray-300 italic">"{sentence}"</li>
            ))}
          </ul>
        </div>
      )}

      {details.partOfSpeech && (
        <div>
          <h5 className="font-semibold text-lg text-gray-200">Part of Speech:</h5>
          <p className="text-gray-300 capitalize">{details.partOfSpeech}</p>
        </div>
      )}

      {details.relatedWords && details.relatedWords.length > 0 && (
        <div>
          <h5 className="font-semibold text-lg text-gray-200">Related Words:</h5>
          <p className="text-gray-300">{details.relatedWords.join(', ')}</p>
        </div>
      )}

      {sourceLanguage !== targetLanguage && details.translation && (
        <div>
          <h5 className="font-semibold text-lg text-gray-200">Translation ({targetLanguage}):</h5>
          <p className="text-gray-300">{details.translation}</p>
        </div>
      )}

      <div className="pt-4 border-t border-gray-700 mt-4">
        <Button onClick={onSaveWord} disabled={isSaved} className="w-full">
          {isSaved ? 'Term Saved!' : 'Save Term'}
        </Button>
      </div>
    </div>
  );
};

export default WordDetailCard;