// ─── Tarot Cards (78 deck) ────────────────────────────────────────────────────
export const MAJOR_ARCANA = [
  { id: 'major_00', name: 'The Fool', number: 0, symbol: '☆', color: '#FFD700', upright: 'New beginnings, innocence, spontaneity, a free spirit.', reversed: 'Recklessness, risk-taking, holding back, naivety.' },
  { id: 'major_01', name: 'The Magician', number: 1, symbol: '∞', color: '#FF6B35', upright: 'Willpower, desire, creation, manifestation.', reversed: 'Trickery, illusions, out-of-touch, poor planning.' },
  { id: 'major_02', name: 'The High Priestess', number: 2, symbol: '☽', color: '#7B68EE', upright: 'Intuition, sacred knowledge, divine feminine, the subconscious.', reversed: 'Secrets, disconnected from intuition, withdrawal, silence.' },
  { id: 'major_03', name: 'The Empress', number: 3, symbol: '♀', color: '#90EE90', upright: 'Femininity, beauty, nature, nurturing, abundance.', reversed: 'Creative block, dependence, smothering, emptiness.' },
  { id: 'major_04', name: 'The Emperor', number: 4, symbol: '♂', color: '#DC143C', upright: 'Authority, establishment, structure, a father figure.', reversed: 'Domination, excessive control, rigidity, stubbornness.' },
  { id: 'major_05', name: 'The Hierophant', number: 5, symbol: '⛪', color: '#DAA520', upright: 'Spiritual wisdom, traditions, conformity, moral compass.', reversed: 'Personal beliefs, freedom, challenging the status quo.' },
  { id: 'major_06', name: 'The Lovers', number: 6, symbol: '♡', color: '#FF69B4', upright: 'Love, harmony, relationships, values alignment, choices.', reversed: 'Self-love, disharmony, imbalance, misaligned values.' },
  { id: 'major_07', name: 'The Chariot', number: 7, symbol: '⚔', color: '#4169E1', upright: 'Control, willpower, success, action, determination.', reversed: 'Lack of control, aggression, powerlessness, self-doubt.' },
  { id: 'major_08', name: 'Strength', number: 8, symbol: '∞', color: '#FFA500', upright: 'Strength, courage, persuasion, influence, compassion.', reversed: 'Inner strength lacking, self-doubt, low energy, raw emotion.' },
  { id: 'major_09', name: 'The Hermit', number: 9, symbol: '🕯', color: '#808080', upright: 'Soul-searching, introspection, being alone, inner guidance.', reversed: 'Isolation, loneliness, withdrawal, being reclusive.' },
  { id: 'major_10', name: 'Wheel of Fortune', number: 10, symbol: '☸', color: '#9370DB', upright: 'Good luck, karma, life cycles, destiny, a turning point.', reversed: 'Bad luck, resistance to change, breaking cycles.' },
  { id: 'major_11', name: 'Justice', number: 11, symbol: '⚖', color: '#4169E1', upright: 'Justice, fairness, truth, cause and effect, law.', reversed: 'Unfairness, lack of accountability, dishonesty.' },
  { id: 'major_12', name: 'The Hanged Man', number: 12, symbol: '△', color: '#20B2AA', upright: 'Pause, surrender, letting go, new perspectives.', reversed: 'Delays, resistance, stalling, indecision.' },
  { id: 'major_13', name: 'Death', number: 13, symbol: '☠', color: '#2F4F4F', upright: 'Endings, change, transformation, transition.', reversed: 'Resistance to change, personal transformation, inner purging.' },
  { id: 'major_14', name: 'Temperance', number: 14, symbol: '◇', color: '#00CED1', upright: 'Balance, moderation, patience, purpose, meaning.', reversed: 'Imbalance, excess, self-healing, re-alignment needed.' },
  { id: 'major_15', name: 'The Devil', number: 15, symbol: '⭐', color: '#8B0000', upright: 'Shadow self, attachment, addiction, restriction, sexuality.', reversed: 'Releasing limiting beliefs, exploring dark thoughts, detachment.' },
  { id: 'major_16', name: 'The Tower', number: 16, symbol: '⚡', color: '#FF4500', upright: 'Sudden change, upheaval, chaos, revelation, awakening.', reversed: 'Personal transformation, fear of change, averting disaster.' },
  { id: 'major_17', name: 'The Star', number: 17, symbol: '★', color: '#87CEEB', upright: 'Hope, faith, purpose, renewal, spirituality.', reversed: 'Lack of faith, despair, self-trust, disconnection.' },
  { id: 'major_18', name: 'The Moon', number: 18, symbol: '☽', color: '#191970', upright: 'Illusion, fear, the unconscious, dreams, vagueness.', reversed: 'Release of fear, repressed emotion, inner confusion.' },
  { id: 'major_19', name: 'The Sun', number: 19, symbol: '☀', color: '#FFD700', upright: 'Positivity, fun, warmth, success, vitality.', reversed: 'Inner child, feeling down, overly optimistic.' },
  { id: 'major_20', name: 'Judgement', number: 20, symbol: '🎺', color: '#DAA520', upright: 'Judgement, rebirth, inner calling, absolution.', reversed: 'Self-doubt, inner critic, ignoring the call, self-loathing.' },
  { id: 'major_21', name: 'The World', number: 21, symbol: '◎', color: '#9370DB', upright: 'Completion, integration, accomplishment, travel.', reversed: 'Seeking personal closure, short-cuts, delays.' },
];

const makeSuit = (suit: string, color: string, symbol: string) => {
  const cards = [];
  const pips = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  const courts = ['Page', 'Knight', 'Queen', 'King'];
  for (const pip of pips) {
    cards.push({ id: `${suit.toLowerCase()}_${pip.toLowerCase()}`, name: `${pip} of ${suit}`, suit, symbol, color });
  }
  for (const court of courts) {
    cards.push({ id: `${suit.toLowerCase()}_${court.toLowerCase()}`, name: `${court} of ${suit}`, suit, symbol, color });
  }
  return cards;
};

export const MINOR_ARCANA = [
  ...makeSuit('Wands', '#FF6B35', '🔥'),
  ...makeSuit('Cups', '#4169E1', '💧'),
  ...makeSuit('Swords', '#C0C0C0', '⚔'),
  ...makeSuit('Pentacles', '#DAA520', '⭐'),
];

export const ALL_TAROT_CARDS = [...MAJOR_ARCANA, ...MINOR_ARCANA];

// ─── Lenormand Cards (36 deck) ────────────────────────────────────────────────
export const LENORMAND_CARDS = [
  { id: 'len_01', name: 'Rider', number: 1, symbol: '🐴', color: '#8B4513', meaning: 'News, movement, progress' },
  { id: 'len_02', name: 'Clover', number: 2, symbol: '☘', color: '#228B22', meaning: 'Luck, small fortune, opportunity' },
  { id: 'len_03', name: 'Ship', number: 3, symbol: '⛵', color: '#4169E1', meaning: 'Journey, travel, ambition' },
  { id: 'len_04', name: 'House', number: 4, symbol: '🏠', color: '#8B6914', meaning: 'Home, security, family' },
  { id: 'len_05', name: 'Tree', number: 5, symbol: '🌳', color: '#2E8B57', meaning: 'Health, growth, roots' },
  { id: 'len_06', name: 'Clouds', number: 6, symbol: '☁', color: '#708090', meaning: 'Confusion, doubt, uncertainty' },
  { id: 'len_07', name: 'Snake', number: 7, symbol: '🐍', color: '#556B2F', meaning: 'Deceit, transformation, wisdom' },
  { id: 'len_08', name: 'Coffin', number: 8, symbol: '⬛', color: '#2F2F2F', meaning: 'Endings, change, letting go' },
  { id: 'len_09', name: 'Bouquet', number: 9, symbol: '💐', color: '#FF69B4', meaning: 'Gifts, happiness, beauty' },
  { id: 'len_10', name: 'Scythe', number: 10, symbol: '⚔', color: '#C0C0C0', meaning: 'Danger, decisions, cutting' },
  { id: 'len_11', name: 'Whip', number: 11, symbol: '〰', color: '#8B0000', meaning: 'Conflict, repetition, exercise' },
  { id: 'len_12', name: 'Birds', number: 12, symbol: '🐦', color: '#87CEEB', meaning: 'Communication, gossip, anxiety' },
  { id: 'len_13', name: 'Child', number: 13, symbol: '⭐', color: '#FFD700', meaning: 'New beginnings, innocence, youth' },
  { id: 'len_14', name: 'Fox', number: 14, symbol: '🦊', color: '#FF6B35', meaning: 'Cunning, deception, work' },
  { id: 'len_15', name: 'Bear', number: 15, symbol: '🐻', color: '#8B4513', meaning: 'Power, authority, protection' },
  { id: 'len_16', name: 'Stars', number: 16, symbol: '★', color: '#191970', meaning: 'Hope, guidance, wishes' },
  { id: 'len_17', name: 'Stork', number: 17, symbol: '🦢', color: '#FFFFFF', meaning: 'Change, improvement, transition' },
  { id: 'len_18', name: 'Dog', number: 18, symbol: '🐕', color: '#8B6914', meaning: 'Friendship, loyalty, trust' },
  { id: 'len_19', name: 'Tower', number: 19, symbol: '🏛', color: '#696969', meaning: 'Authority, isolation, institutions' },
  { id: 'len_20', name: 'Garden', number: 20, symbol: '🌺', color: '#32CD32', meaning: 'Social life, public, gatherings' },
  { id: 'len_21', name: 'Mountain', number: 21, symbol: '⛰', color: '#808080', meaning: 'Obstacles, delays, challenges' },
  { id: 'len_22', name: 'Crossroads', number: 22, symbol: '✦', color: '#DAA520', meaning: 'Choices, decisions, paths' },
  { id: 'len_23', name: 'Mice', number: 23, symbol: '🐭', color: '#696969', meaning: 'Loss, worry, decay' },
  { id: 'len_24', name: 'Heart', number: 24, symbol: '♡', color: '#DC143C', meaning: 'Love, emotions, feelings' },
  { id: 'len_25', name: 'Ring', number: 25, symbol: '◎', color: '#FFD700', meaning: 'Commitment, contracts, cycles' },
  { id: 'len_26', name: 'Book', number: 26, symbol: '📖', color: '#4169E1', meaning: 'Secrets, knowledge, education' },
  { id: 'len_27', name: 'Letter', number: 27, symbol: '✉', color: '#C0C0C0', meaning: 'Messages, documents, news' },
  { id: 'len_28', name: 'Man', number: 28, symbol: '♂', color: '#4169E1', meaning: 'A male person, masculine energy' },
  { id: 'len_29', name: 'Woman', number: 29, symbol: '♀', color: '#FF69B4', meaning: 'A female person, feminine energy' },
  { id: 'len_30', name: 'Lily', number: 30, symbol: '⚜', color: '#FFFFFF', meaning: 'Wisdom, maturity, sexuality' },
  { id: 'len_31', name: 'Sun', number: 31, symbol: '☀', color: '#FFD700', meaning: 'Success, vitality, happiness' },
  { id: 'len_32', name: 'Moon', number: 32, symbol: '☽', color: '#C0C0C0', meaning: 'Intuition, recognition, dreams' },
  { id: 'len_33', name: 'Key', number: 33, symbol: '🗝', color: '#DAA520', meaning: 'Solutions, fate, opportunities' },
  { id: 'len_34', name: 'Fish', number: 34, symbol: '🐟', color: '#4169E1', meaning: 'Finance, abundance, business' },
  { id: 'len_35', name: 'Anchor', number: 35, symbol: '⚓', color: '#2F4F4F', meaning: 'Stability, work, long-term' },
  { id: 'len_36', name: 'Cross', number: 36, symbol: '✦', color: '#8B0000', meaning: 'Burden, destiny, suffering' },
];

// ─── AstroDice ────────────────────────────────────────────────────────────────
export const ASTRODICE_PLANETS = [
  { id: 'sun', name: 'Sun', symbol: '☉', color: '#FFD700', description: 'Core identity, ego, vitality, and conscious self.' },
  { id: 'moon', name: 'Moon', symbol: '☽', color: '#C0C0C0', description: 'Emotions, instincts, habits, and the subconscious.' },
  { id: 'mercury', name: 'Mercury', symbol: '☿', color: '#A8A8A8', description: 'Communication, intellect, reasoning, and travel.' },
  { id: 'venus', name: 'Venus', symbol: '♀', color: '#90EE90', description: 'Love, beauty, values, pleasure, and relationships.' },
  { id: 'mars', name: 'Mars', symbol: '♂', color: '#FF6347', description: 'Drive, ambition, courage, and assertive energy.' },
  { id: 'jupiter', name: 'Jupiter', symbol: '♃', color: '#FFA500', description: 'Expansion, luck, wisdom, growth, and abundance.' },
  { id: 'saturn', name: 'Saturn', symbol: '♄', color: '#CD853F', description: 'Discipline, responsibility, karma, and life lessons.' },
  { id: 'uranus', name: 'Uranus', symbol: '♅', color: '#87CEEB', description: 'Rebellion, innovation, sudden change, and liberation.' },
  { id: 'neptune', name: 'Neptune', symbol: '♆', color: '#6495ED', description: 'Intuition, spirituality, illusion, and dreams.' },
  { id: 'pluto', name: 'Pluto', symbol: '♇', color: '#9370DB', description: 'Transformation, power, death, and rebirth.' },
  { id: 'chiron', name: 'Chiron', symbol: '⚷', color: '#DEB887', description: 'The wounded healer — where you heal others through your own pain.' },
  { id: 'node', name: 'North Node', symbol: '☊', color: '#9370DB', description: 'Karmic destiny, soul purpose, and the direction of growth.' },
];

export const ASTRODICE_SIGNS = [
  { id: 'aries', name: 'Aries', symbol: '♈', color: '#DC143C', description: 'Bold, pioneering, impulsive; the initiator of the zodiac.' },
  { id: 'taurus', name: 'Taurus', symbol: '♉', color: '#228B22', description: 'Steady, sensual, patient; values security and earthly pleasures.' },
  { id: 'gemini', name: 'Gemini', symbol: '♊', color: '#FFD700', description: 'Curious, adaptable, communicative; the eternal student.' },
  { id: 'cancer', name: 'Cancer', symbol: '♋', color: '#C0C0C0', description: 'Nurturing, intuitive, protective; deeply tied to home and emotion.' },
  { id: 'leo', name: 'Leo', symbol: '♌', color: '#FFA500', description: 'Creative, generous, dramatic; born to shine and lead.' },
  { id: 'virgo', name: 'Virgo', symbol: '♍', color: '#9ACD32', description: 'Analytical, practical, helpful; seeks perfection through service.' },
  { id: 'libra', name: 'Libra', symbol: '♎', color: '#FF69B4', description: 'Diplomatic, fair-minded, social; seeks balance and harmony.' },
  { id: 'scorpio', name: 'Scorpio', symbol: '♏', color: '#8B0000', description: 'Intense, perceptive, transformative; dives beneath the surface.' },
  { id: 'sagittarius', name: 'Sagittarius', symbol: '♐', color: '#9400D3', description: 'Adventurous, philosophical, optimistic; seeker of truth.' },
  { id: 'capricorn', name: 'Capricorn', symbol: '♑', color: '#2F4F4F', description: 'Ambitious, disciplined, patient; builds toward lasting achievement.' },
  { id: 'aquarius', name: 'Aquarius', symbol: '♒', color: '#4169E1', description: 'Innovative, humanitarian, independent; ahead of their time.' },
  { id: 'pisces', name: 'Pisces', symbol: '♓', color: '#20B2AA', description: 'Empathic, dreamy, spiritual; dissolves boundaries between worlds.' },
];

export const ASTRODICE_HOUSES = [
  { id: 'h1', name: '1st House', number: 1, meaning: 'Self & Identity' },
  { id: 'h2', name: '2nd House', number: 2, meaning: 'Values & Resources' },
  { id: 'h3', name: '3rd House', number: 3, meaning: 'Communication & Mind' },
  { id: 'h4', name: '4th House', number: 4, meaning: 'Home & Roots' },
  { id: 'h5', name: '5th House', number: 5, meaning: 'Creativity & Joy' },
  { id: 'h6', name: '6th House', number: 6, meaning: 'Health & Service' },
  { id: 'h7', name: '7th House', number: 7, meaning: 'Partnerships' },
  { id: 'h8', name: '8th House', number: 8, meaning: 'Transformation' },
  { id: 'h9', name: '9th House', number: 9, meaning: 'Philosophy & Travel' },
  { id: 'h10', name: '10th House', number: 10, meaning: 'Career & Status' },
  { id: 'h11', name: '11th House', number: 11, meaning: 'Community & Goals' },
  { id: 'h12', name: '12th House', number: 12, meaning: 'Spirituality & Hidden' },
];

// ─── Zodiac Signs ─────────────────────────────────────────────────────────────
export const ZODIAC_SIGNS = [
  { id: 'aries', name: 'Aries', symbol: '♈', element: 'Fire', startMonth: 3, startDay: 21 },
  { id: 'taurus', name: 'Taurus', symbol: '♉', element: 'Earth', startMonth: 4, startDay: 20 },
  { id: 'gemini', name: 'Gemini', symbol: '♊', element: 'Air', startMonth: 5, startDay: 21 },
  { id: 'cancer', name: 'Cancer', symbol: '♋', element: 'Water', startMonth: 6, startDay: 21 },
  { id: 'leo', name: 'Leo', symbol: '♌', element: 'Fire', startMonth: 7, startDay: 23 },
  { id: 'virgo', name: 'Virgo', symbol: '♍', element: 'Earth', startMonth: 8, startDay: 23 },
  { id: 'libra', name: 'Libra', symbol: '♎', element: 'Air', startMonth: 9, startDay: 23 },
  { id: 'scorpio', name: 'Scorpio', symbol: '♏', element: 'Water', startMonth: 10, startDay: 23 },
  { id: 'sagittarius', name: 'Sagittarius', symbol: '♐', element: 'Fire', startMonth: 11, startDay: 22 },
  { id: 'capricorn', name: 'Capricorn', symbol: '♑', element: 'Earth', startMonth: 12, startDay: 22 },
  { id: 'aquarius', name: 'Aquarius', symbol: '♒', element: 'Air', startMonth: 1, startDay: 20 },
  { id: 'pisces', name: 'Pisces', symbol: '♓', element: 'Water', startMonth: 2, startDay: 19 },
];

// ─── Daily Quotes ─────────────────────────────────────────────────────────────
export const DAILY_QUOTES: string[] = [
  "The version of you that hesitates is not the one who arrives.",
  "You are the sky. Everything else is just the weather.",
  "What you seek is also seeking you.",
  "The wound is the place where the light enters you.",
  "Within you there is a stillness and a sanctuary to which you can retreat at any time.",
  "She is a wild, tangled forest with temples and treasures concealed within.",
  "The cosmos is within us. We are made of star-stuff.",
  "Your task is not to seek for love, but merely to seek and find all the barriers within yourself that you have built against it.",
  "You are not a drop in the ocean. You are the entire ocean in a drop.",
  "The quieter you become, the more you can hear.",
  "To shine your brightest light is to be who you truly are.",
  "Sometimes the universe will give you what you need, just not how you expected.",
  "Your soul knows the way. Trust the journey.",
  "In the middle of every difficulty lies opportunity.",
  "Be the silence that heals, the light that guides.",
  "Everything you need is within you right now.",
  "The stars are not only in the sky — they are inside you.",
  "Go inward. That is where the truth lives.",
  "What if this moment was enough?",
  "Your spirit is ancient. Your wisdom is deep. You are only just beginning to remember.",
  "Let yourself be silently drawn by the strange pull of what you really love.",
  "You were born with wings. Why do you prefer to crawl?",
  "Do not rush. The river always finds its way to the sea.",
  "There are no mistakes. Only lessons.",
  "Trust the magic of new beginnings.",
  "The universe does not punish or forgive. It only responds.",
  "Every morning we are born again. What we do today matters most.",
  "Sit with it. The answer will come when you are still.",
  "You are never lost when you trust your own light.",
  "Align with your higher self. Everything else will follow.",
  "The planet is not dying — it is transforming. So are you.",
  "Breathe. You have survived 100% of your hardest days.",
  "The present moment is always the right moment.",
  "Soften your eyes and let the world come to you.",
  "You are whole. You are enough. You are seen.",
  "The root grows strongest in the dark.",
  "What you resist persists. What you embrace dissolves.",
  "In every ending, a beginning is already underway.",
  "Let your light be wild and untameable.",
  "Your story is still being written. Turn the page.",
  "Healing is not linear. It is a spiral — you will visit this place again, but from a higher point.",
  "The moon does not question her light. Neither should you.",
  "Something is always blooming. Look closer.",
  "You are not behind. You are on your own path.",
  "The answer you are looking for is on the other side of stillness.",
];

// ─── Audio Files ───────────────────────────────────────────────────────────────
// Format: [theme]name.mp3 from Google Drive folder
// Update driveFileId with real Google Drive file IDs from your folder
export interface AudioTrack {
  id: string;
  title: string;
  theme: string;
  category: 'meditation' | 'sleep';
  driveFileId: string; // Google Drive file ID
}

export const MEDITATION_THEMES = ['Focus', 'Letting go', 'Mindfulness', 'Compassion', 'Connection'] as const;
export const SLEEP_THEMES = ['Tapping', 'Nature', 'Personal care', 'Ear massage', 'Mouth sounds'] as const;

// Placeholder audio data - populate driveFileId from your Google Drive folder
// File format: [theme]name.mp3 → parsed into theme + title
export const AUDIO_TRACKS: AudioTrack[] = [
  // Meditation tracks (from connected Google Drive folder)
  { id: 'm_fo1', title: "Calming and Steadying with the Breath", theme: 'Focus', category: 'meditation', driveFileId: '1HuxgpP7h1DqwNsojWgUUZKaHZO4q59_h' },
  { id: 'm_mi1', title: "Mindful Presence, Breath Awareness", theme: 'Mindfulness', category: 'meditation', driveFileId: '15TxshNVg4kpcJt9s95NtArAkElF8dQSS' },
  { id: 'm_cn1', title: "Dialogue with Your Body", theme: 'Connection', category: 'meditation', driveFileId: '1TBdZu2hS3h1xNiLBuVT_WrkVTb6qLogc' },
  { id: 'm_fo2', title: "Meditation as Free Breathing", theme: 'Focus', category: 'meditation', driveFileId: '1S6a0UVpid-gWdU0nUIYqxy1G4R3AsQ-f' }, // was "Ancient Breathing Technique"
  { id: 'm_cm1', title: "Activating Self Healing", theme: 'Compassion', category: 'meditation', driveFileId: '1WXRb2rjvYYRqzzSp0yL5B7tt8-R30wnf' },
  { id: 'm_fo3', title: "Full Concentration, Daily Awareness", theme: 'Focus', category: 'meditation', driveFileId: '1XUoOznys_xgVmZNbwmuA8ebXyfHvNIbQ' },
  { id: 'm_cn2', title: "Food Body Connection", theme: 'Connection', category: 'meditation', driveFileId: '1XFPDKVYCKfq-9iRf99lRnU1hkPMlJLqF' },
  { id: 'm_lg1', title: "Opening Yourself, Becoming Clear", theme: 'Letting go', category: 'meditation', driveFileId: '1XoVWluMj8JOw61OkvYG-TatVsn8bRBfN' },
  { id: 'm_cn3', title: "Reclaiming Your Inner Space", theme: 'Connection', category: 'meditation', driveFileId: '1aVXzBAd6wuSA6sdoX6x49GB0aOFzTKdu' },
  { id: 'm_cn4', title: "Connecting Through Sight and Touch", theme: 'Connection', category: 'meditation', driveFileId: '1pToI1sPv589uyL_ehjvn46nhvfWfUdvB' },
  { id: 'm_mi2', title: "Peace in Your Chest", theme: 'Mindfulness', category: 'meditation', driveFileId: '1a_cE8Tdjd5sldvV520VlR7AjRUci0tss' },
  { id: 'm_lg2', title: "Letting the Problem Float Away", theme: 'Letting go', category: 'meditation', driveFileId: '1wU5ROiY-uEyaDbOC4lPog9Rr69HQ2SXg' },
  { id: 'm_cn5', title: "Seeking Your True Self", theme: 'Connection', category: 'meditation', driveFileId: '12w-1Wk1xpjpN96cayaKN5rYaO6U_psJc' },
  { id: 'm_lg3', title: "Desire Distances You from Self", theme: 'Letting go', category: 'meditation', driveFileId: '1o9H4zqDX7mvOwT22cO_IJt0OXY0eBEWc' },
  { id: 'm_fo4', title: "Building Your Energy Field", theme: 'Focus', category: 'meditation', driveFileId: '1NYmrTxFf_VwtdI-Rua71XHGSRydXfAWR' },
  { id: 'm_cm2', title: "Attitude of Friendliness", theme: 'Compassion', category: 'meditation', driveFileId: '1VB7Qyn6ELikDfb3WrZAA1ZsNzZ0YTz0m' },
  { id: 'm_fo5', title: "Deepening the Focus", theme: 'Focus', category: 'meditation', driveFileId: '1Woe3RzeEct90NiQ8PRebwBaXZVD0sX3P' },
  { id: 'm_mi3', title: "Feeling from the Inside Out", theme: 'Mindfulness', category: 'meditation', driveFileId: '1JEqKH-_0Rp7BKa9b2dYzOVrI2wGs7sTh' },
  { id: 'm_mi4', title: "Body Scan", theme: 'Mindfulness', category: 'meditation', driveFileId: '1DXfOZEwS-VZNcxip84KhtupZnIdwJFcE' },
  { id: 'm_mi5', title: "Naming Sensations", theme: 'Mindfulness', category: 'meditation', driveFileId: '1KAkmosVmlq4mxax_TYpIiCatAN_UTi_3' },
  { id: 'm_mi6', title: "Naming Emotions", theme: 'Mindfulness', category: 'meditation', driveFileId: '1-VN1wTc1yue_T4y_WHaVZJn80rEEFhJi' },
  { id: 'm_lg4', title: "Working with Intense Sensations", theme: 'Letting go', category: 'meditation', driveFileId: '1atWIoOdj0uXaD70m7uwRe44kW1QHuoxZ' },
  { id: 'm_lg5', title: "Working with Difficult Emotions", theme: 'Letting go', category: 'meditation', driveFileId: '1VeodzHamM1DnGcTnC_ktWENYVoaLoZIB' },
  { id: 'm_cm3', title: "Self Judgement and Self Compassion", theme: 'Compassion', category: 'meditation', driveFileId: '18phc7j1qGMBb_i3z_dQQ6jA8YE5phWS1' },
  { id: 'm_cm4', title: "Empathy and Compassion", theme: 'Compassion', category: 'meditation', driveFileId: '1zR-xKAaa441YDrHknXSYw-ViSEGTXEwn' },
  { id: 'm_cm5', title: "Forgiveness", theme: 'Compassion', category: 'meditation', driveFileId: '1VXtdHA_uhZ8rVpLKMyayKf9GI3K0s3Uw' },
  { id: 'm_fo6', title: "Intention", theme: 'Focus', category: 'meditation', driveFileId: '1viRvASHpMbmX5BgsU9M6FLlAaoJTHuSq' },
  { id: 'm_cn6', title: "Aspiration and Vision", theme: 'Connection', category: 'meditation', driveFileId: '18N1mwAuoyHEXon4oYxK-QVefl1qrQE1L' },
  { id: 'm_lg6', title: "Trusting and Inhabiting Your Being", theme: 'Letting go', category: 'meditation', driveFileId: '10ViL8-KfKF-Hf28x3OudMhLArQvzpz68' },
  { id: 'm_cm6', title: "Nourishing a Grateful Heart", theme: 'Compassion', category: 'meditation', driveFileId: '1wqipI2hliJMd1owB8fEL87XR9mzU5Zv4' },
  // Sleep tracks (from connected Google Drive folder)
  { id: 's_t1', title: "Cork Board", theme: 'Tapping', category: 'sleep', driveFileId: '1vVD75WiqaUay1K_xyxMlUw50LMWMOScs' },
  { id: 's_em1', title: "Sand Stone", theme: 'Ear massage', category: 'sleep', driveFileId: '1utqYzOkSmy_Gx86nmNWhnAZgpaqfu_yg' },
  { id: 's_em2', title: "Sponge", theme: 'Ear massage', category: 'sleep', driveFileId: '1aZ8PnaPLi43Ycu_wSszhCZ-5a0sxZ15Q' },
  { id: 's_em3', title: "Underwater", theme: 'Ear massage', category: 'sleep', driveFileId: '1ugwyZzRJOeFR7DLGanUv2QL1_2Jkom2l' },
  { id: 's_t2', title: "Wood Soup 2", theme: 'Tapping', category: 'sleep', driveFileId: '1JgId0gKBrxO1_tYLjdtG2V7dvpXJ07UF' },
  { id: 's_t3', title: "Wood Soup 1", theme: 'Tapping', category: 'sleep', driveFileId: '1uBD0R1WngIb1nAQaGx0Z6AwBKg0FsiBC' },
  { id: 's_t4', title: "Wood Board", theme: 'Tapping', category: 'sleep', driveFileId: '1OtADvDZ6VgCaPn8KmivJnrd2nJlCcgNT' },
  { id: 's_t5', title: "Wood Block", theme: 'Tapping', category: 'sleep', driveFileId: '1TIdRCl2EAijxL2ELmfVBt_6HBuvrdhZL' },
  { id: 's_t6', title: "Tree Ring", theme: 'Tapping', category: 'sleep', driveFileId: '1XBusKdewm3SDXW37Jj7HnYwUA1hUqs5n' },
  { id: 's_t7', title: "Temple Block", theme: 'Tapping', category: 'sleep', driveFileId: '1zMZSZB3stGJrRN4vmYv1rugbXT-q-RU-' },
  { id: 's_t8', title: "Tapping Mix 2", theme: 'Tapping', category: 'sleep', driveFileId: '1iROsswLMqCjdPFvRNY_5p1QBaRFYJIFm' },
  { id: 's_t9', title: "Tapping Mix 1", theme: 'Tapping', category: 'sleep', driveFileId: '15a1mQK_aNZUdQujW2CQF_hGnijp5GsPv' },
  { id: 's_t10', title: "Pumice Stone", theme: 'Tapping', category: 'sleep', driveFileId: '1Gf0FT4iMN7JeD6jvK2D1JIozugM5ePuY' },
  { id: 's_t11', title: "Paper Box", theme: 'Tapping', category: 'sleep', driveFileId: '1sYIC7fe34Taq_sewgfyliMxR_M6BHN-V' },
  { id: 's_t12', title: "Membrane", theme: 'Tapping', category: 'sleep', driveFileId: '1NtpCFuDiz-OyrDSReNFIOswRvgn4ekcB' },
  { id: 's_t13', title: "Keyboard", theme: 'Tapping', category: 'sleep', driveFileId: '1d8k5IPoGJ-mfQU2D7CWT-gPtgBGnRNf6' },
  { id: 's_t14', title: "Hardwood", theme: 'Tapping', category: 'sleep', driveFileId: '11tN57gSnwZPmUFkXXCWraJBxkVFpmkHT' },
  { id: 's_t15', title: "Glass Mix", theme: 'Tapping', category: 'sleep', driveFileId: '1UTTH0ZRxeNNpCepW8IUrIA9E5u7oOgJj' },
  { id: 's_t16', title: "Ear Tapping", theme: 'Tapping', category: 'sleep', driveFileId: '1hP_NKYZp9kGX1Vc7FrsA0XH4ZUOq-6ws' },
  { id: 's_t17', title: "Daily Objects 2", theme: 'Tapping', category: 'sleep', driveFileId: '1uzO-mpELLb-oGBzpmTpkz9kr8MklOwcj' },
  { id: 's_t18', title: "Daily Objects 1", theme: 'Tapping', category: 'sleep', driveFileId: '1fOPVEgNzocJTiRZQbiMb6aV5In5V6DFx' },
  { id: 's_t19', title: "Book Cover", theme: 'Tapping', category: 'sleep', driveFileId: '1J2bDwYGplVDcaiwQzRb_P61xJE7_AY-8' },
  { id: 's_t20', title: "Beeswax Wrap", theme: 'Tapping', category: 'sleep', driveFileId: '1KfQiqFLouF3NJ1MilHmuPlrDeVwpJbRm' },
  { id: 's_pc1', title: "Scalp Scratching", theme: 'Personal care', category: 'sleep', driveFileId: '1ix5cbqk1QG7fQLARKwMD3Y5ZaJH_1PTK' },
  { id: 's_pc2', title: "Scalp Massage", theme: 'Personal care', category: 'sleep', driveFileId: '1lxm7GzLrxffFcetILwAyn1UKQGFAU4Es' },
  { id: 's_pc3', title: "Powder Puff", theme: 'Personal care', category: 'sleep', driveFileId: '1nqXVSZUf97gO-exhCLt5v8qtWH4PeGYb' },
  { id: 's_pc4', title: "Orange Foam", theme: 'Personal care', category: 'sleep', driveFileId: '1ucbYUFDLvkBWlnxhtgMYWRIr1iy7RYLo' },
  { id: 's_pc5', title: "Kinetic Sand", theme: 'Personal care', category: 'sleep', driveFileId: '1wEkLQldjQL2GiO6uHzJqqWq5hPdhNMvG' },
  { id: 's_pc6', title: "Head Rubbing", theme: 'Personal care', category: 'sleep', driveFileId: '1ThaXftukyJ1PTS7snGmzNGBB06bThQNd' },
  { id: 's_pc7', title: "Head Massage", theme: 'Personal care', category: 'sleep', driveFileId: '1WCojKOq0iscb_hEu_Xe8_xhP33XFNHGm' },
  { id: 's_pc8', title: "Head Cleaning", theme: 'Personal care', category: 'sleep', driveFileId: '1O3ZOpAQ-qBwo_jAhi9uRNEitpeq8FdWM' },
  { id: 's_pc9', title: "Handwriting", theme: 'Personal care', category: 'sleep', driveFileId: '11sh7Ijo_TNaro4VrdN6hQafc7oVdCxjF' },
  { id: 's_pc10', title: "Hand Rubbing", theme: 'Personal care', category: 'sleep', driveFileId: '1YEru6T3O0MTk4DZCOP2cLp-abmBXa9Qk' },
  { id: 's_pc11', title: "Hairdressing", theme: 'Personal care', category: 'sleep', driveFileId: '1tJH_Xci1zZmArLIM84ELogY1Pd_FdbLt' },
  { id: 's_pc12', title: "Floral Foam", theme: 'Personal care', category: 'sleep', driveFileId: '1hEgbHfxof_3pEjITUbqjUw5Tu7IQlpYS' },
  { id: 's_pc13', title: "Face Cleaning", theme: 'Personal care', category: 'sleep', driveFileId: '1KOeT91g5BYL0b1tCHqkt_wRBHbhT6Fef' },
  { id: 's_pc14', title: "Face Brush", theme: 'Personal care', category: 'sleep', driveFileId: '1J8obU_nz1Z3_HUDNmOU0sfuzb7TzhTlI' },
  { id: 's_pc15', title: "Cuttlebone", theme: 'Personal care', category: 'sleep', driveFileId: '1muqnFw_T0D0t37dOBaw44KTAMlShQt_3' },
  { id: 's_pc16', title: "Binaural Hair Washing", theme: 'Personal care', category: 'sleep', driveFileId: '1sN9BSVuXbQ1o-lwEEEH4rCsU6tFcvUgt' },
  { id: 's_pc17', title: "Beard Cleaning", theme: 'Personal care', category: 'sleep', driveFileId: '1o4YkuruOflWoraeCTUxWZlJ1un75Z5SD' },
  { id: 's_pc18', title: "Barber Shaving", theme: 'Personal care', category: 'sleep', driveFileId: '1KQN_DDA7fQjLJonQelIji_Z8NIr4I0t_' },
  { id: 's_pc19', title: "Aloe Gel", theme: 'Personal care', category: 'sleep', driveFileId: '1I-BrKcLhmBpDaQcT4mK-R-ZOIWRLcNl7' },
  { id: 's_pc20', title: "Aloe Gel Hand Rubbing", theme: 'Personal care', category: 'sleep', driveFileId: '101z-PM-sQ-Bbpnl-IOVSGHbBWO6usd6W' },
  { id: 's_n1', title: "Wind Chime", theme: 'Nature', category: 'sleep', driveFileId: '1GKdD2zu9tqTinkGMXgWaVWbAX3mWhQ1B' },
  { id: 's_n2', title: "Water Hourglass", theme: 'Nature', category: 'sleep', driveFileId: '1lnv1N-T632HcF2aRI6woMhW5z4vXY-nD' },
  { id: 's_n3', title: "Walking on Snow", theme: 'Nature', category: 'sleep', driveFileId: '1ZVE_oQbL7nYwWOtlriSfo-XktLtwA-xc' },
  { id: 's_n4', title: "Under the Sea", theme: 'Nature', category: 'sleep', driveFileId: '120QSImLtbd5XM8gjBZ4rWW_rBvSyIPjh' },
  { id: 's_n5', title: "Tibetan Singing Bowl", theme: 'Nature', category: 'sleep', driveFileId: '1ebIMzoJ8pzD66EjQTeZUDcS2FTnhNmtX' },
  { id: 's_n6', title: "Thunderstorm", theme: 'Nature', category: 'sleep', driveFileId: '1ItOvOmB5aixNRt7xE-ByWh54W55bRnFh' },
  { id: 's_n7', title: "Rainforest", theme: 'Nature', category: 'sleep', driveFileId: '1Awz4NmUbW6Qopq2f9I_m782efgcfBJ2z' },
  { id: 's_n8', title: "Rain and Singing Bowl", theme: 'Nature', category: 'sleep', driveFileId: '1w8q-urgOBrFZUPj7KO3HMXuS9SPJl7vu' },
  { id: 's_n9', title: "Rain and Campfire", theme: 'Nature', category: 'sleep', driveFileId: '1HG20Ftjb7X5Bv-9dUVF2iQY6Vxg0tDOc' },
  { id: 's_n10', title: "Pinecone", theme: 'Nature', category: 'sleep', driveFileId: '1XX0Uf0P4TnPNZBWPg65HEtoZaADmp0n4' },
  { id: 's_n11', title: "Ocean Waves", theme: 'Nature', category: 'sleep', driveFileId: '1eViiCiJIG6dceJQ7rXmT5zOy4H8qxItT' },
  { id: 's_n12', title: "Night Rain", theme: 'Nature', category: 'sleep', driveFileId: '1BV0VxvaIKbxpQNRHbpGjrLvDJSqeVlNX' },
  { id: 's_n13', title: "Mini Singing Bowl", theme: 'Nature', category: 'sleep', driveFileId: '1C9eMWCWEexV1S6qFTVfmJGDUCtHNWX0G' },
  { id: 's_n14', title: "Forest Campfire", theme: 'Nature', category: 'sleep', driveFileId: '1nsGsUeVo1qSaGENcm5-bBTogiDkrZiUE' },
  { id: 's_n15', title: "Diving", theme: 'Nature', category: 'sleep', driveFileId: '1bq0eggf_wQ64SKGuQKtnrkfR7XJC8yRb' },
  { id: 's_n16', title: "Creek", theme: 'Nature', category: 'sleep', driveFileId: '1mPfFEQlw6vJHrJWPzHl8cJylSvKnZb4d' },
  { id: 's_n17', title: "City Street", theme: 'Nature', category: 'sleep', driveFileId: '1YOvioGwhlhSJ1l8W4Q6o-j4aIsuOv7r1' },
  { id: 's_n18', title: "Cicada", theme: 'Nature', category: 'sleep', driveFileId: '1kgRKveUZszB--hJBt4AnEMZBCGR1w5wF' },
  { id: 's_n19', title: "Candle Burning", theme: 'Nature', category: 'sleep', driveFileId: '1k6UFTeQMAgZwu3qQLKbf0o5U-MXf8BIL' },
  { id: 's_n20', title: "Bamboo Chime", theme: 'Nature', category: 'sleep', driveFileId: '1dUdSnLdpU47UQFlmrhrltPPnv-jwmfVh' },
  { id: 's_ms1', title: "Wood Spoon", theme: 'Mouth sounds', category: 'sleep', driveFileId: '12xPSrH1yfXmHnR4NDV-hMdOiScaIPH6d' },
  { id: 's_ms2', title: "Spoon Mix", theme: 'Mouth sounds', category: 'sleep', driveFileId: '14Sg3mEqEDpBrfQ_db6_1mKIkT4BablzK' },
  { id: 's_ms3', title: "Spit Painting", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1tfyqZtDRtvubCj9hWa37ffXxoI-mKNbQ' },
  { id: 's_ms4', title: "Snack Mix 2", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1Lu9VIJeJsuhzCMdTmd4giIr6TqSJ5Nxc' },
  { id: 's_ms5', title: "Snack Mix 1", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1i2gsc2jmK2tnEFgvAo9eheWJ75PdXq6m' },
  { id: 's_ms6', title: "Mushroom", theme: 'Mouth sounds', category: 'sleep', driveFileId: '17CkKVn22n0FqAwwu0c5HgAbatzPGT_E5' },
  { id: 's_ms7', title: "Mouth Sound Mix 5", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1uK4TjkKHnfxZABq8sBli1HLBngzs2czi' },
  { id: 's_ms8', title: "Mouth Sound Mix 4", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1_TGpajIgeYKTsJvGkMZsZBeexBdRUMoW' },
  { id: 's_ms9', title: "Mouth Sound Mix 3", theme: 'Mouth sounds', category: 'sleep', driveFileId: '128HMNEH5iC-SHY8zAvB4RhOy0_xXdyNJ' },
  { id: 's_ms10', title: "Mouth Sound Mix 2", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1zhZ3bFFPI91wU0MQnnAjpECwn8hLDrgO' },
  { id: 's_ms11', title: "Mouth Sound Mix 1", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1qbEMlt8M1MR2H71bibExE_hnV6YysJnY' },
  { id: 's_ms12', title: "Midnight Snack", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1faO-y08QItLwF5oOFeATO9SXoN_8OVns' },
  { id: 's_ms13', title: "Jam", theme: 'Mouth sounds', category: 'sleep', driveFileId: '17VYXUrhy_gmEYEPmJ3JIiCQm-Tl5Ox3k' },
  { id: 's_ms14', title: "Honeycomb Spoon", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1y1u4fftXeoO2SLjNAbr6jbtuhCCIZgaI' },
  { id: 's_ms15', title: "Fruit", theme: 'Mouth sounds', category: 'sleep', driveFileId: '14bgyTDgpaFqqhAi2x7XyWI7V-UNbMQsN' },
  { id: 's_ms16', title: "Eating Mix 2", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1O5zyNcQiSfaHtJZdLBzBWMqF8hgqns1R' },
  { id: 's_ms17', title: "Eating Mix 1", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1-Pe-f-Ov801RGR2AHsrriZXgvlJWMoFs' },
  { id: 's_ms18', title: "Crystal Candy", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1I0F24vm9oogsTVfuxLlIFdR8DRTCicKf' },
  { id: 's_ms19', title: "Chocolate", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1B3E_B__1zsc6t1kXscnjguT66udqNJiX' },
  { id: 's_ms20', title: "Alien Pen", theme: 'Mouth sounds', category: 'sleep', driveFileId: '1I8F89g_bP61tNI1QnC-OUb86Y1xHr9Su' },
  { id: 's_em4', title: "Spoolie", theme: 'Ear massage', category: 'sleep', driveFileId: '1ebGKUBveK9slvbXvXAIvau3znuPwaBpm' },
  { id: 's_em5', title: "Sand", theme: 'Ear massage', category: 'sleep', driveFileId: '14-utME6MCuCGqH96E2Zl3rlhZfCoX1Jo' },
  { id: 's_em6', title: "Pipe Cleaner", theme: 'Ear massage', category: 'sleep', driveFileId: '1f5n7H4SUffeTNcMlDydE0j3h6oefIfHL' },
  { id: 's_em7', title: "Lanolin Ear Cupping", theme: 'Ear massage', category: 'sleep', driveFileId: '1u2iL5UETMH5kgWCtgpnwXjz0iiRFJDwF' },
  { id: 's_em8', title: "Feather", theme: 'Ear massage', category: 'sleep', driveFileId: '1LsXXEjZ70sL_jqig-KCGUDoI9HW6B2as' },
  { id: 's_em9', title: "Ear Scrub", theme: 'Ear massage', category: 'sleep', driveFileId: '1PCVc2YlJFCWh0w1PxDHtoiCdg2iqmI0l' },
  { id: 's_em10', title: "Ear Pick", theme: 'Ear massage', category: 'sleep', driveFileId: '18-J8-A7mlWMA2dpf_ELM5Xx5Odzx5DPx' },
  { id: 's_em11', title: "Ear Nibbling", theme: 'Ear massage', category: 'sleep', driveFileId: '180J7FLXWyJ4lk4BKnpw2zTLv32U-bfs4' },
  { id: 's_em12', title: "Ear Cleaning", theme: 'Ear massage', category: 'sleep', driveFileId: '1fmwlwlJZQcr967FvrHcGOb4bAFOFIGy2' },
  { id: 's_em13', title: "Deep Ear Cleaning", theme: 'Ear massage', category: 'sleep', driveFileId: '1-5Fm75Gt1BQCA4D9WAZyrp3Z0dado4FI' },
  { id: 's_em14', title: "Cotton Swab", theme: 'Ear massage', category: 'sleep', driveFileId: '1RnZX7Um5j4WdPXZD2fXIld0-YqqfG7FD' },
  { id: 's_em15', title: "Binaural Mic", theme: 'Ear massage', category: 'sleep', driveFileId: '1HaMj4nTkUVncjBEX3u64sbqCxzihNcdC' },
  { id: 's_em16', title: "Beeswax Wrap", theme: 'Ear massage', category: 'sleep', driveFileId: '1AhRMvwFPrjJHe8AATmsV6pcl31GtGFKk' },
  { id: 's_em17', title: "Aloe Gel Ear Cupping", theme: 'Ear massage', category: 'sleep', driveFileId: '1cp9o89IIGERpEE8UjwOHU1EDZRmMj-yG' },
  { id: 's_em18', title: "3dio Mic", theme: 'Ear massage', category: 'sleep', driveFileId: '1P-YWTLlYPp80n_aj7StFc4slo8EbPzMr' },
  { id: 's_em19', title: "Kinetic Sand", theme: 'Ear massage', category: 'sleep', driveFileId: '1zln98T6hGW2cAeXKkzehbNJ6UBJlfE2D' },
  { id: 's_em20', title: "Goose Feather", theme: 'Ear massage', category: 'sleep', driveFileId: '1UBMbrX53cnV2DTdP5tZ7Uzgf76G7pGnQ' },

];

export function getDriveStreamUrl(fileId: string): string {
  // Streamed through our own API server (which holds the Google Drive OAuth
  // token) rather than fetched directly from Google, since the app has no
  // Drive credentials of its own and the files aren't publicly shared.
  const domain = process.env['EXPO_PUBLIC_DOMAIN'];
  const baseUrl = domain ? `https://${domain}` : '';
  return `${baseUrl}/api/audio/${fileId}`;
}

// ─── Tarot / Lenormand card artwork (Google Drive) ─────────────────────────────
// Maps each card's `name` to its Drive file ID for the higher-quality artwork
// the user supplied, streamed through /api/images (mirrors getDriveStreamUrl).
// Keep in sync with ALLOWED_IMAGE_FILE_IDS in
// artifacts/api-server/src/routes/imageAllowlist.ts.
export const TAROT_IMAGE_IDS: Record<string, string> = {
  "The Fool": "1dLsip79qQiQs6PvSsZwpLk4tYQ2rkqpN",
  "The Magician": "1RbVPC8-F_QEaxACPFlujMyAmdVEV2Jdz",
  "The High Priestess": "1kTxPI2pHmBaJoQrhUgUdonCGJ-Sls6nq",
  "The Empress": "1X6vtYOFaFljDzUB_axas6NwuX9E_O11H",
  "The Emperor": "1oshz5vc45EH1cXM5Rglj83OReFHggx1d",
  "The Hierophant": "1ApE0WLs-_46NO-5mbBO6StZo7ytYF5-d",
  "The Lovers": "1JDDPQmtypDx08lN8BYauq2fCas8eLK3n",
  "The Chariot": "15d6cQnfI5tWj3bG57w74bua8KSaBx58w",
  "Strength": "1UJgndx5vmnlXKX4Z7dYvZa9MVahpYTVW",
  "The Hermit": "1d23TPnN3roklT_aR7J6wJ_lT-BQPjXZU",
  "Wheel of Fortune": "1WZ7bJq9F9ywLDi42n9MLMWDflJglawoK",
  "Justice": "1khQyfob9vg_c_b9560UdkYhHX-XvDMRU",
  "The Hanged Man": "1fxd_cZhfihHeMYd5Pw9iBId6x3ePYWiX",
  "Death": "1jKJ_i67MGsceDDL8atUTBHjU9s0quPzs",
  "Temperance": "1MjHvSw7lhYPgMXfFMNx3z6hbZWe7rzJS",
  "The Devil": "1wjw6OaiF3Qlwb-vYpjuid3euOm7ccLcv",
  "The Tower": "1aPxJvkSU5bMh2sjyEXhKo-Vh5btgh9WI",
  "The Star": "1cRqYWZAAp7XtkGE6gxFt4xbC1priVVl-",
  "The Moon": "1d8L6MoBBmaEIXVeSf9ZqrXnguHQe9mhp",
  "The Sun": "145vFB8k8zHR4KX8LyCpULHe1ROdL-CaB",
  "Judgement": "1uetiTaw1_MzlDkb3AmpYt-j28tMSvZLS",
  "The World": "1pj1cOtdjufvxGDa_imelnJD8rI3iI5hu",
  "Ace of Wands": "1WCd0Sn34zT14pfkIteqvnPQgm93HPEYG",
  "Two of Wands": "1bJmCvPx7KlqJhApESzGqJGoAc_97l9Dt",
  "Three of Wands": "126ajo7orKYZ1h8MfvQi99QkXiA-jbUv9",
  "Four of Wands": "12yLWmXfEC_ZwIA_pfNGsoYnuDkmFizJc",
  "Five of Wands": "1A8jMnjJh4st5cd_UKraDled_V15vKQZH",
  "Six of Wands": "1PctLHntTSPdHQ2HCoVfKVdAuqUC4bek7",
  "Seven of Wands": "1BGW5_p0qVJAcUuqP8AoygtJyi2TU1dat",
  "Eight of Wands": "1Yafuc0vOT4OGDKNVg8kgHKQ4UKfdv2bg",
  "Nine of Wands": "1swxn-43lwbb0osV-ehM4NrV9-tuksb4O",
  "Ten of Wands": "1B7Jc4IYa4UfVw_IuDiMmO5cq3Mf-2K_b",
  "Page of Wands": "1Knfts-niuMk98Z59hu1NLwSPVb90sONW",
  "Knight of Wands": "1fzR2EzOVEbKEdcUNJKuC_fA8JKBFGJGi",
  "Queen of Wands": "1XzbkIEHSB6OMQ_aNU9C1x8VKo_GkGAzi",
  "King of Wands": "1wC0nO6sLGo1uwppuy90x4Fy1Ni4ZfLgB",
  "Ace of Cups": "12JK7g50ZKALuO8506v0qb2oFSs_NLLst",
  "Two of Cups": "1VWwUUMwgI8tjdIyVtkkSkSnzg6gPPyKJ",
  "Three of Cups": "1K0xaAfdz6d9qIv3pnH4sUkPsUGN2lDt2",
  "Four of Cups": "1JYrduwxLlbYGqD8VIMM9hhx9T4u5aII-",
  "Five of Cups": "1EKHGgcQvr_msIHsFeqJyOcQsHkmjjSFk",
  "Six of Cups": "1BdRmoHRMLegcEOBeW8112bIENYojOgF_",
  "Seven of Cups": "1rtcr_rXD6zfKBKxb4YVEqnNCggXO3ksX",
  "Eight of Cups": "1gEpxR8N0YM6Tg-NgruZJQRzS3zry88fj",
  "Nine of Cups": "1t0DuoyONNYJ0xlMFp54Dn7NGocUxZJLV",
  "Ten of Cups": "1I4_o07lJ7xu1FEwRRU-6-j7qz81By6Yq",
  "Page of Cups": "1K2HoLPL_1ytYW5GYviLe6XuqGOM2u6j3",
  "Knight of Cups": "1h3MUaQ7xY0XjogSjyFo5fHRzh9cHKLa-",
  "Queen of Cups": "1s6TT_hc8u2J38bB6KB4Q4XwuRBkZC5lR",
  "King of Cups": "1FsyLjehIotQ1EOsiT_BMKnzXNjfnlW-N",
  "Ace of Swords": "1t2Gqy9SbaaEwXQNwIX9wZjNeuXc7Eug1",
  "Two of Swords": "1x9wi4Gc8S5tfi8hblaPPUnIG64e6qE3e",
  "Three of Swords": "1lf3fmP4Wlz3RBfBSRLATyzDN4JbZBZrp",
  "Four of Swords": "1UnRclK78Vj9h84yT_hflVYzDGzjIX6Ft",
  "Five of Swords": "1S-6kedzAxtUXU-j1XSF3g1PPLljIJDUM",
  "Six of Swords": "1NYuX5p57zW121t1lakGhvMjdhIMkcOU3",
  "Seven of Swords": "1aIW17c05ox6ta5O27JX9tKRoXV2-NEpO",
  "Eight of Swords": "1-GZzGyiVcR71ULT-1SKaRw7chv7U5Pjz",
  "Nine of Swords": "1WyCb_AX7ZzaOZpTA7pPtWPFZPVKYjyQP",
  "Ten of Swords": "1fseQj1ecFrw-JZ91cW3N0shaUwBievOs",
  "Page of Swords": "1b0a4mWSsyTiISsdR9dh2ItNVsN-QdUlm",
  "Knight of Swords": "1D8gYUVieWSMLcl10Xbhd6ugUgEX8bxSG",
  "Queen of Swords": "1J1CeCxnan2bwxfMRkS0NupNr7-dUH8wj",
  "King of Swords": "14FO3H2HlcHslVmrOzg3QPi3d2Za7bYIy",
  "Ace of Pentacles": "1gdfW5pzoDVj-SheTKPDWQ99zI368CW3l",
  "Two of Pentacles": "1liQ7KkgDyr1Bp87oTbfbr_sVfG81ZoLh",
  "Three of Pentacles": "1baz-3XKM50s1PV1zxt94JzIrOW7wAZKI",
  "Four of Pentacles": "1ad1efZ5iubkPN2x58jJmegb-LcIiTHQb",
  "Five of Pentacles": "1PNrTvZfomvd5F90HBjZNDTVjTeu-bDnZ",
  "Six of Pentacles": "1O39-9hGwum6QaaP3rNTHoLlUhV0KqtaR",
  "Seven of Pentacles": "1s1EmayGtTk_icgbt4eqr9PCcK8bf-ZT3",
  "Eight of Pentacles": "1ljEYEJWbR4P5mNQH23aICpl0lNZakg5C",
  "Nine of Pentacles": "1YLG5q_qL9p0iFHabCbbUuNRhLGAQeOYF",
  "Ten of Pentacles": "1TtPBd0VBHYSxnLn5mCJhzKjwACfoGnbF",
  "Page of Pentacles": "18osF37f3H-OCD3hviCgxJNVUhn_bQKHL",
  "Knight of Pentacles": "16d5Rs1Uu3FTtiXQED2qH3Toam80VqhtT",
  "Queen of Pentacles": "1V-paOqxY8ThpBldiinWH6LLO2aHNvvan",
  "King of Pentacles": "1oz8Q59s9LwmwNTT5Wlv5duxjEKoSvZ0L",

};

export const LENORMAND_IMAGE_IDS: Record<string, string> = {
  "Rider": "1Nm1eEvcVynHCz1PZQfJCN92qELzNz51t",
  "Clover": "1Zs7S_Sj-vUHPp1plXsEOj1jjjZH9C9xQ",
  "Ship": "1HUQtgvOW41fGXwfzlSIi1wgs_DskNF2C",
  "House": "1ZGChm6h3m3Mc48no0pVT9tBKMIs2zm-i",
  "Tree": "18a2Iy8MjUbWDXd24d2tmkCtCpPHNhLF8",
  "Clouds": "17hj05BJL30anf8gyAM_vUWV4TurWWTre",
  "Snake": "1l8x3YDPLQ1FdX9sg09dPqJfR-vew4-JQ",
  "Coffin": "12ZKMR5wKZl9QgTXdAhDxNRy63gxRNjqu",
  "Bouquet": "1WN6KpWOfbHuuXuo0idDICaOBLIZ9eFbb",
  "Scythe": "1vnvWRmwlIBimhOb_V6WVH5CNnxgbilFh",
  "Whip": "1MHjAuG2iZJYTEg8fFy0typWWQEGS1za0",
  "Birds": "1fqVqTdUEqNDWVEKzki82TzMGaSxYtl7n",
  "Child": "1x4AHXg8pbD7IpIFPkxMf6kK1o7J2q-GJ",
  "Fox": "1CRiqgRlgYkhbanulbT8TL7A1e4kxASEl",
  "Bear": "1LBPdUznP_x5nqgTdYXOp9oyVEkgO1W7b",
  "Stars": "12lYMBdnVdVL0I3epMt9v6ODUtIBaQu_C",
  "Stork": "1Q8VKH3OCTQg3qy_lnGzkYWYtKWntq3JY",
  "Dog": "1dt9vmdwmry7MBfGNE-jLzoNBS-xtlr_Q",
  "Tower": "1peXUf0VGsQgh0kGpZc8gou635mqmxxfW",
  "Garden": "1ycrY1uS0mx9_0j5fNZO9FvXkvqgp0aNJ",
  "Mountain": "1iGFu0jy48DE2Yb7jRJdMknMZyBkgWnbi",
  "Crossroads": "1eS9mCu1JNaQ5M61c94HSsPc4C7ziYy5u",
  "Mice": "13OZPNq3i7yh-TOdX7Q7UkzbxOoNI2kXr",
  "Heart": "1rsfA0uIRGJzGGiQbxPT5PgkEsgUW8mL9",
  "Ring": "1L8nGLNnoFZ4IfjADFFzNKr-eZWLnGRBE",
  "Book": "18OUby2c2YsAv0C6yqxxGu1ZZXrl4e9LQ",
  "Letter": "1bt4q4TjkWAMteIFb4gYS73Ma0BElZMEv",
  "Man": "1CwzZisgrMt5D0t5MayvG2olKsUIhkDfr",
  "Woman": "1-F_pVygR2VSHcJxzE4RnsIRbaFg0rG9E",
  "Lily": "1NogkY1otkFGx86bs4nlWL4TYJCPi-x6y",
  "Sun": "1ZkGoid143VA2Zuc61arUWy8eiHPk_mk0",
  "Moon": "1ZyOpisSnnbkS0HiC3U-hByD47taH6OjR",
  "Key": "1NPqARgmaoI4sHtP8upf0hqb4yp2iF2xW",
  "Fish": "15MHpsqC772SfOwulzggSkTfX7XpE5yRt",
  "Anchor": "1lFkij12vnPSnPGBpqMdKA8INUrhaq9th",
  "Cross": "1as7Bquf8G4w7qfsXD4PBi36ju4DN2-PR",

};

export function getDriveImageUrl(fileId: string): string {
  const domain = process.env['EXPO_PUBLIC_DOMAIN'];
  const baseUrl = domain ? `https://${domain}` : '';
  return `${baseUrl}/api/images/${fileId}`;
}

// ─── Play Modes ───────────────────────────────────────────────────────────────
export const PLAY_MODES = [
  { id: 'tarot_spread', label: 'Tarot – Spread (3 cards)', description: 'Past / Present / Future' },
  { id: 'tarot_5card', label: 'Tarot – Spread (5 cards)', description: 'Potential / Past / Present / Future / Reason' },
  { id: 'astro_individual', label: 'Astrology – Individual Chart', description: 'Read your birth chart' },
  { id: 'astro_compatibility', label: 'Astrology – Compatibility', description: 'Compare two charts' },
  { id: 'astrodice', label: 'AstroDice', description: 'Planet, sign & house oracle' },
  { id: 'lenormand', label: 'Lenormand', description: '3-card Lenormand spread' },
] as const;

export type PlayModeId = typeof PLAY_MODES[number]['id'];

// ─── Timer Options ─────────────────────────────────────────────────────────────
export const TIMER_OPTIONS = [
  { id: 'none', label: 'No timer',         seconds: null as null },
  { id: 'end',  label: 'Until track ends', seconds: null as null },
  { id: '10m',  label: '10 min',           seconds: 600 },
  { id: '20m',  label: '20 min',           seconds: 1200 },
  { id: '30m',  label: '30 min',           seconds: 1800 },
  { id: '1h',   label: '1 hour',           seconds: 3600 },
  { id: '2h',   label: '2 hours',          seconds: 7200 },
];

// ─── Relationship Types ────────────────────────────────────────────────────────
export const RELATIONSHIPS = ['Spouse', 'Boyfriend/Girlfriend', 'Friend', 'Family', 'Child', 'Special'] as const;
export type RelationshipType = typeof RELATIONSHIPS[number] | 'Self';

// ─── Gender Options ────────────────────────────────────────────────────────────
export const GENDERS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'] as const;

// ─── Theme Images ──────────────────────────────────────────────────────────────
export const THEME_COLORS: Record<string, string> = {
  // Meditation
  'Focus': '#2D4A6B',
  'Letting go': '#5B3A5B',
  'Mindfulness': '#2A5B4A',
  'Compassion': '#6B3A3A',
  'Connection': '#3A4A6B',
  // Sleep
  'Tapping': '#1A2535',
  'Nature': '#1A2B1A',
  'Personal care': '#3B2535',
  'Ear massage': '#252535',
  'Mouth sounds': '#351A35',
};

export const THEME_IMAGES: Record<string, any> = {
  'Focus': require('@/assets/images/themes/focus.jpg'),
  'Letting go': require('@/assets/images/themes/letting_go.jpg'),
  'Mindfulness': require('@/assets/images/themes/mindfulness.jpg'),
  'Compassion': require('@/assets/images/themes/compassion.jpg'),
  'Connection': require('@/assets/images/themes/connection.jpg'),
  'Tapping': require('@/assets/images/themes/tapping.jpg'),
  'Nature': require('@/assets/images/themes/nature.jpg'),
  'Personal care': require('@/assets/images/themes/personal_care.jpg'),
  'Ear massage': require('@/assets/images/themes/ear_massage.jpg'),
  'Mouth sounds': require('@/assets/images/themes/mouth_sounds.jpg'),
};

export const THEME_SYMBOLS: Record<string, string> = {
  'Focus': '◎',
  'Letting go': '〜',
  'Mindfulness': '◇',
  'Compassion': '♡',
  'Connection': '◈',
  'Tapping': '∷',
  'Nature': '❧',
  'Personal care': '✾',
  'Ear massage': '))))',
  'Mouth sounds': '≋',
};
