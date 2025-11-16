import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import TextInput from './components/TextInput';
import LanguageSelector from './components/LanguageSelector';
import Button from './components/Button';
import Modal from './components/Modal';
import WordDetailCard from './components/WordDetailCard';
import SavedWordsList from './components/SavedWordsList';
import { Language, ProcessedTextPart, WordDetail, SavedWord } from './types';
import { SUPPORTED_LANGUAGES, DEFAULT_TARGET_LANGUAGE } from './constants';
import { getTermDetails, detectLanguage } from './services/geminiService';

function App() {
  const [inputText, setInputText] = useState<string>('');
  const [detectedSourceLanguage, setDetectedSourceLanguage] = useState<Language | null>(null);
  const [isDetectingLanguage, setIsDetectingLanguage] = useState<boolean>(false);
  const [targetLanguage, setTargetLanguage] = useState<Language>(DEFAULT_TARGET_LANGUAGE);
  const [processedTextParts, setProcessedTextParts] = useState<ProcessedTextPart[]>([]);

  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [wordDetails, setWordDetails] = useState<WordDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [savedWords, setSavedWords] = useState<SavedWord[]>([]);

  // Ref for the clickable text display to handle clicks outside phrases
  const clickableTextRef = useRef<HTMLDivElement>(null);

  // Memoize the regex for splitting words
  const wordSplitRegex = useMemo(() => /([\p{L}\p{N}]+)|(\s+)|([^\p{L}\p{N}\s]+)/gu, []);

  // Effect to re-process text when input changes or language changes
  useEffect(() => {
    if (!inputText) {
      setProcessedTextParts([]);
      setDetectedSourceLanguage(null);
      return;
    }

    const parts: ProcessedTextPart[] = [];
    let match;

    const currentRegex = wordSplitRegex;
    currentRegex.lastIndex = 0; // Reset lastIndex for consistent exec calls

    while ((match = currentRegex.exec(inputText)) !== null) {
      const value = match[0];
      if (value) {
        if (match[1]) { // Group 1 matched: it's a word (Unicode letters or numbers)
          const cleanedWord = value.toLowerCase(); // Simplified cleanup as punctuation is now separate
          parts.push({
            type: 'word',
            value: value,
            originalWord: cleanedWord,
            id: `word-${parts.length}-${cleanedWord}`,
          });
        } else if (match[2]) { // Group 2 matched: it's whitespace
          parts.push({
            type: 'whitespace',
            value: value,
            id: `ws-${parts.length}`,
          });
        } else if (match[3]) { // Group 3 matched: it's punctuation or other symbol
          parts.push({
            type: 'punctuation',
            value: value,
            id: `punct-${parts.length}`,
          });
        }
      }
    }
    setProcessedTextParts(parts);
  }, [inputText, wordSplitRegex]);

  // Effect for automatic language detection
  useEffect(() => {
    const autoDetect = async () => {
      if (inputText.trim()) {
        setIsDetectingLanguage(true);
        const lang = await detectLanguage(inputText);
        setDetectedSourceLanguage(lang);
        setIsDetectingLanguage(false);
      } else {
        setDetectedSourceLanguage(null);
      }
    };
    const handler = setTimeout(autoDetect, 500); // Debounce language detection
    return () => clearTimeout(handler);
  }, [inputText]);

  const effectiveSourceLanguage = useMemo(() => {
    return detectedSourceLanguage || Language.ENGLISH; // Fallback if detection is pending or fails
  }, [detectedSourceLanguage]);

  const handleTermClick = useCallback(async (
    term: string,
    sourceLang: Language,
    targetLang: Language,
  ) => {
    console.log(`handleTermClick invoked for term: "${term}" with sourceLang: ${sourceLang}`);
    setSelectedTerm(term);
    setWordDetails(null);
    setIsModalOpen(true);
    setIsLoading(true);
    setError(null);

    try {
      const details = await getTermDetails(term, sourceLang, targetLang);
      if (details) {
        setWordDetails(details);
      } else {
        // This 'null' could come from a JSON_PARSE_ERROR or other API issues in getTermDetails
        setError('The AI could not process this phrase into the requested format. This might happen with very complex or unusual phrases. Please try a simpler phrase or individual words.');
      }
    } catch (err) {
      console.error(`Failed to fetch term details for "${term}":`, err);
      // Generic error message for network issues or unhandled exceptions
      setError('An unexpected error occurred while fetching term details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTerm(null);
    setWordDetails(null);
    setError(null);
  }, []);

  const clearInput = useCallback(() => {
    setInputText('');
    setProcessedTextParts([]);
    setSelectedTerm(null);
    setWordDetails(null);
    setIsModalOpen(false);
    setIsLoading(false);
    setError(null);
    setDetectedSourceLanguage(null);
    setIsDetectingLanguage(false);
  }, []);

  const handleSaveWord = useCallback(() => {
    if (selectedTerm && wordDetails && !isLoading) {
      const isAlreadySaved = savedWords.some(
        (sw) => sw.term === selectedTerm && sw.sourceLanguage === effectiveSourceLanguage
      );
      if (!isAlreadySaved) {
        const newSavedWord: SavedWord = {
          term: selectedTerm,
          sourceLanguage: effectiveSourceLanguage,
          targetLanguage,
          details: wordDetails,
          savedAt: Date.now(),
        };
        setSavedWords((prev) => [...prev, newSavedWord]);
      } else {
        console.log(`${selectedTerm} is already saved.`);
      }
    }
  }, [selectedTerm, wordDetails, isLoading, effectiveSourceLanguage, targetLanguage, savedWords]);

  const handleRemoveWord = useCallback((termToRemove: string, lang: Language) => {
    setSavedWords((prev) => prev.filter(
      (sw) => !(sw.term === termToRemove && sw.sourceLanguage === lang)
    ));
  }, []);

  const isCurrentTermSaved = useMemo(() => {
    if (!selectedTerm) return false;
    return savedWords.some(
      (sw) => sw.term === selectedTerm && sw.sourceLanguage === effectiveSourceLanguage
    );
  }, [selectedTerm, savedWords, effectiveSourceLanguage]);

  // Determine text direction for the clickable text display
  const isRTL = useMemo(() => {
    return effectiveSourceLanguage === Language.HEBREW || effectiveSourceLanguage === Language.ARABIC;
  }, [effectiveSourceLanguage]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      selection?.removeAllRanges(); // Clear any existing selection
      return;
    }

    const range = selection.getRangeAt(0);
    const clickableTextDiv = clickableTextRef.current;

    // Ensure selection is within our clickable text area
    if (!clickableTextDiv || !clickableTextDiv.contains(range.commonAncestorContainer)) {
      selection.removeAllRanges(); // Clear outside selections
      return;
    }

    // Helper to find the closest data-part-index element, considering text nodes
    const findPartElement = (node: Node | null): HTMLElement | null => {
      if (!node) return null;
      if (node.nodeType === Node.ELEMENT_NODE) {
        return (node as HTMLElement).closest('[data-part-index]') as HTMLElement | null;
      }
      return (node.parentElement as HTMLElement | null)?.closest('[data-part-index]') as HTMLElement | null;
    };

    const startElement = findPartElement(range.startContainer);
    const endElement = findPartElement(range.endContainer);

    const startIdx = parseInt(startElement?.dataset.partIndex || '-1', 10);
    const endIdx = parseInt(endElement?.dataset.partIndex || '-1', 10);

    // If selection boundaries are not on valid parts, or indices are invalid
    if (startIdx === -1 || endIdx === -1) {
      selection.removeAllRanges();
      return;
    }

    const actualStartIdx = Math.min(startIdx, endIdx);
    const actualEndIdx = Math.max(startIdx, endIdx);

    const relevantParts = processedTextParts.slice(actualStartIdx, actualEndIdx + 1);
    const selectedWordParts = relevantParts.filter(p => p.type === 'word');

    if (selectedWordParts.length >= 2) { // Only trigger for phrases (2 or more words)
      const phraseText = selectedWordParts.map(p => p.value).join(' ');
      console.log('Phrase selected, automatically looking up:', phraseText);
      handleTermClick(phraseText, effectiveSourceLanguage, targetLanguage);
      selection.removeAllRanges(); // Clear browser highlight after lookup is triggered
    } else {
      selection.removeAllRanges(); // Clear browser highlight for single words or non-word selections
    }
  }, [processedTextParts, effectiveSourceLanguage, targetLanguage, handleTermClick]);

  // Removed the useEffect for "click away to deselect phrase" as activePhrase state is removed.

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-gradient-to-br from-zinc-900 via-gray-950 to-indigo-950 transition-colors duration-300">
      {/* Dark mode toggle removed */}

      <div className="bg-gray-900 p-10 rounded-3xl shadow-2xl w-full max-w-4xl space-y-8 border border-indigo-800 transition-colors duration-300">
        <h1 className="text-5xl font-extrabold text-center text-indigo-400 mb-8 tracking-tight">LinguaMaster</h1>
        <p className="text-center text-gray-300 mb-10 text-lg">
          Paste text, click any word or highlight a phrase to get definitions, pronunciations, and examples!
        </p>

        <TextInput
          label="Input Text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="mb-6"
        />

        <div className="flex justify-between items-center gap-4 mb-8">
          <div className="flex items-center text-md font-medium text-gray-300">
            Detected Language:
            {isDetectingLanguage ? (
              <span className="ml-2 flex items-center text-indigo-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400 mr-2"></div>
                Detecting...
              </span>
            ) : (
              <span className="ml-2 font-semibold capitalize text-indigo-400">
                {detectedSourceLanguage ? detectedSourceLanguage : 'N/A'}
              </span>
            )}
          </div>
          <LanguageSelector
            label="Translate to"
            selectedLanguage={targetLanguage}
            onLanguageChange={setTargetLanguage}
            options={SUPPORTED_LANGUAGES}
            className="w-1/2"
          />
        </div>

        <div className="flex justify-center mb-8">
          <Button onClick={clearInput} variant="secondary" size="lg">
            Clear Text
          </Button>
        </div>

        {inputText && processedTextParts.length > 0 && (
          <div className="p-7 bg-zinc-950 rounded-2xl shadow-md border border-indigo-900 min-h-[180px] transition-colors duration-300">
            <h3 className="text-2xl font-bold text-indigo-300 mb-5">Clickable Text:</h3>
            <div
              id="clickable-text-display"
              ref={clickableTextRef}
              className="text-lg leading-relaxed text-gray-200 select-text"
              dir={isRTL ? 'rtl' : 'ltr'}
              onMouseUp={handleMouseUp}
            >
              {processedTextParts.map((part, index) => {
                return part.type === 'word' ? (
                  <button
                    key={part.id}
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent any parent handlers from firing unnecessarily
                        handleTermClick(part.originalWord!, effectiveSourceLanguage, targetLanguage);
                    }}
                    className="inline-block relative z-10 mx-0.5 px-1 py-0.5 cursor-pointer
                                 text-emerald-400 hover:text-emerald-300
                                 font-semibold underline decoration-emerald-600 decoration-2
                                 hover:decoration-emerald-500 focus:outline-none focus:ring-2
                                 focus:ring-emerald-300 rounded-md transition-colors duration-300"
                    data-part-index={index}
                    aria-label={`Look up word: ${part.originalWord!}`}
                  >
                    {part.value}
                  </button>
                ) : (
                  <span key={part.id} data-part-index={index} className="text-gray-200">
                    {part.value}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-8">
          <SavedWordsList
            savedWords={savedWords}
            onTermClick={handleTermClick}
            onRemoveWord={handleRemoveWord}
          />
        </div>

        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Details for "${selectedTerm || 'term'}"`}>
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              <p className="ml-4 text-gray-400">Loading term details...</p>
            </div>
          )}
          {error && (
            <div className="text-red-400 bg-red-950 p-4 rounded-md border border-red-800">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          {wordDetails && !isLoading && !error && (
            <WordDetailCard
              term={selectedTerm || ''}
              details={wordDetails}
              sourceLanguage={effectiveSourceLanguage}
              targetLanguage={targetLanguage}
              onSaveWord={handleSaveWord}
              isSaved={isCurrentTermSaved}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}

export default App;