export type ScreeningFlag = 
  | 'none'
  | 'hate_speech'
  | 'threat'
  | 'self_harm'
  | 'contact_info'
  | 'name_pattern';

export interface ScreeningResult {
  flag: ScreeningFlag;
}

export function isPriorityFlag(flag: ScreeningFlag): boolean {
  return flag === 'self_harm' || flag === 'threat';
}

const PATTERNS = {
  // Simple regexes for Phase 1. In a real system these would be more robust.
  selfHarm: /(kill myself|ending my life|don\'?t want to be alive|cutting myself|suicide)/i,
  threat: /(shoot everyone|kill him|bomb the|murder|beat up)/i,
  contactInfo: /(\d{3}[-\s]?\d{3}[-\s]?\d{4}|\w+@\w+\.\w+|@[\w.]+|whatsapp)/i,
  hateSpeech: /(tribalistic|animals.*village)/i,
};

// Words that are capitalized but shouldn't trigger the name pattern
const NAME_ALLOWLIST = new Set([
  'SRC', 'Student', 'Representative', 'Council', 
  'UPSA', 'University', 'Library', 'Main', 'Auditorium',
  'Accounting', 'Society', 'Opinion', 'I'
]);

export function screenConfession(text: string): ScreeningResult {
  // Check priority flags first
  if (PATTERNS.selfHarm.test(text)) return { flag: 'self_harm' };
  if (PATTERNS.threat.test(text)) return { flag: 'threat' };
  
  // Then other severe flags
  if (PATTERNS.hateSpeech.test(text)) return { flag: 'hate_speech' };
  if (PATTERNS.contactInfo.test(text)) return { flag: 'contact_info' };

  // Heuristic name pattern check: look for two or more capitalized words in a row
  const words = text.split(/\s+/);
  let capSequence = 0;
  
  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (!cleanWord) continue;

    if (cleanWord[0] === cleanWord[0].toUpperCase() && cleanWord !== cleanWord.toUpperCase()) {
      if (!NAME_ALLOWLIST.has(cleanWord)) {
        capSequence++;
        if (capSequence >= 2) {
           return { flag: 'name_pattern' };
        }
      } else {
        capSequence = 0;
      }
    } else {
      capSequence = 0;
    }
  }

  return { flag: 'none' };
}
