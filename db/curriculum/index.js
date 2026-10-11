import { partsOfSpeechCategories } from './parts-of-speech.js';
import { tenseCategories } from './tenses.js';
import { grammarTopicCategories } from './grammar-topics.js';

export const curriculumCategories = [
  ...partsOfSpeechCategories,
  ...tenseCategories,
  ...grammarTopicCategories
];
