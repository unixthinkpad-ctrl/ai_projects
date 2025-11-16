import { GoogleGenAI, Type, Modality } from '@google/genai';
import { WordDetail, Language } from '../types';
import { GEMINI_MODEL_TEXT_TASK } from '../constants';

/**
 * Initializes the GoogleGenAI client.
 * Note: The API key is sourced from process.env.API_KEY.
 * It's created inside the function to ensure the latest API key is used,
 * especially relevant for environments where the key might be selected at runtime.
 */
const getGeminiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error('API_KEY is not defined in the environment variables.');
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Detects the language of a given text using the Gemini API.
 * @param text The text to detect the language for.
 * @returns A Promise resolving to the detected Language enum or null if detection fails.
 */
export const detectLanguage = async (text: string): Promise<Language | null> => {
  try {
    const ai = getGeminiClient();
    const prompt = `Detect the language of the following text: \`${text}\`. Respond with only the name of the language (e.g., 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Hebrew', 'Arabic', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Hindi').`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        language: { type: Type.STRING, description: 'The detected language name.' },
      },
      required: ['language'],
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT_TASK,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });

    const jsonStr = response.text.trim();
    const cleanJsonStr = jsonStr.startsWith('\`\`\`json\n') && jsonStr.endsWith('\n\`\`\`')
      ? jsonStr.substring(8, jsonStr.length - 4)
      : jsonStr;

    const parsedResponse = JSON.parse(cleanJsonStr) as { language: string };
    const detectedLangName = parsedResponse.language.toLowerCase();

    // Map detected language string to Language enum
    const languageMap: { [key: string]: Language } = {
      'english': Language.ENGLISH,
      'spanish': Language.SPANISH,
      'french': Language.FRENCH,
      'german': Language.GERMAN,
      'italian': Language.ITALIAN,
      'portuguese': Language.PORTUGUESE,
      'hebrew': Language.HEBREW,
      'arabic': Language.ARABIC,
      'chinese': Language.CHINESE,
      'japanese': Language.JAPANESE,
      'korean': Language.KOREAN,
      'russian': Language.RUSSIAN,
      'hindi': Language.HINDI,
    };

    return languageMap[detectedLangName] || null;

  } catch (error) {
    console.error('Error detecting language:', error);
    return null;
  }
};


/**
 * Fetches details for a given term (word or phrase) using the Gemini API.
 * @param term The word or phrase to get details for.
 * @param sourceLanguage The language of the input text.
 * @param targetLanguage The language for translation (if different from source).
 * @returns A Promise resolving to WordDetail or null if an error occurs.
 */
export const getTermDetails = async ( // Renamed from getWordDetails
  term: string, // Changed from word to term
  sourceLanguage: Language,
  targetLanguage: Language,
): Promise<WordDetail | null> => {
  try {
    const ai = getGeminiClient();

    const textPrompt = `Provide the following details for the term "${term}" in ${sourceLanguage}:
    1. A concise definition.
    2. Phonetic pronunciation (if applicable).
    3. Three example sentences using the term in ${sourceLanguage}.
    4. Its part of speech (if applicable to a phrase, provide the primary type, otherwise for a single word).
    5. Two related words or phrases (synonyms or antonyms) in ${sourceLanguage}.
    ${sourceLanguage !== targetLanguage ? `6. A translation of the term to ${targetLanguage}.` : ''}

    Format the response as a JSON object strictly adhering to the schema provided.`;

    console.log(`[getTermDetails] Sending text prompt for "${term}" in ${sourceLanguage}:`, textPrompt); // Debug log

    const textResponseSchema = {
      type: Type.OBJECT,
      properties: {
        definition: { type: Type.STRING, description: `Definition of the term "${term}" in ${sourceLanguage}.` },
        pronunciation: { type: Type.STRING, description: `Phonetic pronunciation of "${term}".` },
        exampleSentences: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: `Three example sentences using "${term}" in ${sourceLanguage}.`,
        },
        partOfSpeech: { type: Type.STRING, description: `Part of speech for "${term}".` },
        relatedWords: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: `Two related words (synonyms/antonyms) for "${term}" in ${sourceLanguage}.`,
        },
        ...(sourceLanguage !== targetLanguage && {
          translation: { type: Type.STRING, description: `Translation of "${term}" to ${targetLanguage}.` },
        }),
      },
      required: ['definition', 'exampleSentences'],
    };

    const textDetailsPromise = ai.models.generateContent({
      model: GEMINI_MODEL_TEXT_TASK,
      contents: [{ parts: [{ text: textPrompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: textResponseSchema,
      },
    });

    const audioPrompt = `Say the term "${term}" clearly.`; // Updated prompt
    console.log(`[getTermDetails] Sending audio prompt for "${term}":`, audioPrompt); // Debug log

    const audioDetailsPromise = ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: audioPrompt }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                // Note: Prebuilt voices like 'Kore' might not provide native pronunciation for all languages.
                // For optimal pronunciation in languages like Hebrew, a language-specific voice would be ideal if available.
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' }, // Using 'Kore' as an example voice
                },
            },
        },
    });

    const [textResponse, audioResponse] = await Promise.all([textDetailsPromise, audioDetailsPromise]);

    console.log(`[getTermDetails] Raw text response for "${term}":`, textResponse.text); // Debug log
    const jsonStr = textResponse.text.trim();
    // Gemini sometimes wraps JSON in markdown code blocks, so we need to clean it up.
    const cleanJsonStr = jsonStr.startsWith('\`\`\`json\n') && jsonStr.endsWith('\n\`\`\`')
      ? jsonStr.substring(8, jsonStr.length - 4)
      : jsonStr;

    let textWordDetail: WordDetail;
    try {
      textWordDetail = JSON.parse(cleanJsonStr) as WordDetail;
    } catch (parseError) {
      console.error(`[getTermDetails] Failed to parse JSON for "${term}". Raw response:`, cleanJsonStr, 'Error:', parseError);
      // Throw a specific error to be caught by App.tsx for better user feedback
      throw new Error('JSON_PARSE_ERROR');
    }

    const audioBase64 = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    console.log(`[getTermDetails] Audio response for "${term}" received:`, !!audioBase64); // Debug log

    return {
      ...textWordDetail,
      audioBase64: audioBase64 || undefined, // Add audio data if available
    };
  } catch (error) {
    console.error(`Error fetching details for "${term}":`, error);
    if ((error as Error).message === 'JSON_PARSE_ERROR') {
      return null; // Return null to indicate parsing failure to App.tsx
    }
    return null;
  }
};

/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data into an AudioBuffer.
 * @param data The Uint8Array containing raw PCM data.
 * @param ctx The AudioContext to create the buffer.
 * @param sampleRate The sample rate of the audio.
 * @param numChannels The number of audio channels.
 * @returns A Promise resolving to an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}