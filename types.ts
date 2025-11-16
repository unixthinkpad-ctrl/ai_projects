export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  ITALIAN = 'Italian',
  PORTUGUESE = 'Portuguese',
  HEBREW = 'Hebrew',
  ARABIC = 'Arabic',
  CHINESE = 'Chinese',
  JAPANESE = 'Japanese',
  KOREAN = 'Korean',
  RUSSIAN = 'Russian',
  HINDI = 'Hindi',
}

export interface LanguageOption {
  label: string;
  value: Language;
}

export interface WordDetail {
  definition: string;
  pronunciation?: string; // Phonetic spelling
  exampleSentences: string[];
  partOfSpeech?: string;
  relatedWords?: string[]; // synonyms/antonyms
  translation?: string; // Translation to the target language
  audioBase64?: string; // Base64 encoded audio for pronunciation
}

export interface SavedWord {
  term: string; // Changed from 'word' to 'term' to support phrases
  sourceLanguage: Language;
  targetLanguage: Language;
  details: WordDetail;
  savedAt: number; // Timestamp for sorting/review if implemented later
}

export interface ProcessedTextPart {
  type: 'word' | 'whitespace' | 'punctuation';
  value: string;
  originalWord?: string; // The cleaned word/term for API call
  id: string; // Unique ID for React key
}