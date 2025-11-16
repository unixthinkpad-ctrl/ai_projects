import { Language, LanguageOption } from './types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { label: 'English', value: Language.ENGLISH },
  { label: 'Spanish', value: Language.SPANISH },
  { label: 'French', value: Language.FRENCH },
  { label: 'German', value: Language.GERMAN },
  { label: 'Italian', value: Language.ITALIAN },
  { label: 'Portuguese', value: Language.PORTUGUESE },
  { label: 'Hebrew', value: Language.HEBREW },
  { label: 'Arabic', value: Language.ARABIC },
  { label: 'Chinese', value: Language.CHINESE },
  { label: 'Japanese', value: Language.JAPANESE },
  { label: 'Korean', value: Language.KOREAN },
  { label: 'Russian', value: Language.RUSSIAN },
  { label: 'Hindi', value: Language.HINDI },
];

export const GEMINI_MODEL_TEXT_TASK = 'gemini-2.5-flash';
export const DEFAULT_TARGET_LANGUAGE = Language.ENGLISH;
