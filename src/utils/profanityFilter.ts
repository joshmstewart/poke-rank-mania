
// Simple profanity filter for usernames
const PROHIBITED_WORDS = [
  // Basic inappropriate words
  'fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'bastard',
  'crap', 'piss', 'cock', 'dick', 'pussy', 'tits', 'boobs',
  'sex', 'porn', 'nude', 'naked', 'xxx',
  // Hate speech and slurs (basic list)
  'nazi', 'hitler', 'racist', 'nigger', 'faggot', 'retard',
  // Gaming/online toxicity
  'noob', 'scrub', 'toxic', 'cancer', 'aids',
  // Pokemon-specific inappropriate
  'pokeporn', 'pokeslut',
  // Admin/system terms that might confuse users
  'admin', 'moderator', 'mod', 'system', 'support', 'official',
  'staff', 'owner', 'root', 'superuser'
];

export const containsProfanity = (text: string): boolean => {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase()
    // Remove common character substitutions
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[5$]/g, 's')
    .replace(/[7]/g, 't')
    // Remove non-alphanumeric characters
    .replace(/[^a-z0-9]/g, '');

  return PROHIBITED_WORDS.some(word => 
    normalizedText.includes(word.toLowerCase())
  );
};

export const getProfanityError = (text: string): string | null => {
  if (containsProfanity(text)) {
    return 'Username contains inappropriate language. Please choose a different username.';
  }
  return null;
};
