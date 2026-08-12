// Natal chart calculations, powered by a real ephemeris (VSOP87 via the
// `astronomia` library, wrapped by `circular-natal-horoscope-js`). This
// replaces the previous simplified/approximate formulas, and also gives us
// accurate real-world timezone resolution (IANA tz + DST) from lat/lon
// instead of a rough "15 degrees per hour" heuristic.
// Import the compiled `dist` entry directly: the package's `module` field
// points at an unbundled `src/index.js` that isn't actually published,
// which breaks Metro's web bundling if resolved via the bare specifier.
// eslint-disable-next-line import/no-internal-modules
import { Origin, Horoscope } from 'circular-natal-horoscope-js/dist/index';

export interface PlanetPosition {
  planet: string;
  symbol: string;
  longitude: number; // ecliptic longitude in degrees 0-360
  sign: string;
  signSymbol: string;
  house: number;
  color: string;
}

export interface AstroAspect {
  planet1: string;
  planet2: string;
  aspectType: string;
  orb: number;
  isHarmonious: boolean;
  description: string;
}

export interface NatalChart {
  positions: PlanetPosition[];
  aspects: AstroAspect[];
  ascendant: number;
  ascendantSign: string;
  mc: number; // Midheaven
}

const SIGNS = [
  { name: 'Aries', symbol: '♈', color: '#DC143C' },
  { name: 'Taurus', symbol: '♉', color: '#228B22' },
  { name: 'Gemini', symbol: '♊', color: '#FFD700' },
  { name: 'Cancer', symbol: '♋', color: '#C0C0C0' },
  { name: 'Leo', symbol: '♌', color: '#FFA500' },
  { name: 'Virgo', symbol: '♍', color: '#9ACD32' },
  { name: 'Libra', symbol: '♎', color: '#FF69B4' },
  { name: 'Scorpio', symbol: '♏', color: '#8B0000' },
  { name: 'Sagittarius', symbol: '♐', color: '#9400D3' },
  { name: 'Capricorn', symbol: '♑', color: '#708090' },
  { name: 'Aquarius', symbol: '♒', color: '#4169E1' },
  { name: 'Pisces', symbol: '♓', color: '#20B2AA' },
];

const SIGN_BY_KEY: Record<string, { name: string; symbol: string; color: string }> = {
  aries: SIGNS[0], taurus: SIGNS[1], gemini: SIGNS[2], cancer: SIGNS[3],
  leo: SIGNS[4], virgo: SIGNS[5], libra: SIGNS[6], scorpio: SIGNS[7],
  sagittarius: SIGNS[8], capricorn: SIGNS[9], aquarius: SIGNS[10], pisces: SIGNS[11],
};

const PLANET_META: Record<string, { label: string; symbol: string; color: string }> = {
  sun: { label: 'Sun', symbol: '☉', color: '#FFD700' },
  moon: { label: 'Moon', symbol: '☽', color: '#C0C0C0' },
  mercury: { label: 'Mercury', symbol: '☿', color: '#A8A8A8' },
  venus: { label: 'Venus', symbol: '♀', color: '#90EE90' },
  mars: { label: 'Mars', symbol: '♂', color: '#FF6347' },
  jupiter: { label: 'Jupiter', symbol: '♃', color: '#FFA500' },
  saturn: { label: 'Saturn', symbol: '♄', color: '#CD853F' },
  uranus: { label: 'Uranus', symbol: '♅', color: '#87CEEB' },
  neptune: { label: 'Neptune', symbol: '♆', color: '#6495ED' },
  pluto: { label: 'Pluto', symbol: '♇', color: '#9370DB' },
  northnode: { label: 'North Node', symbol: '☊', color: '#C9973A' },
  lilith: { label: 'Lilith', symbol: '⚸', color: '#9B30FF' },
};

// Order used to render planet lists throughout the app.
const PLANET_ORDER = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'northnode', 'lilith'];

function normalize360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Builds a natal chart from a local birth date/time + place. Timezone
 * (including historical DST rules) is resolved internally from latitude/
 * longitude by the ephemeris library — callers should pass local wall-clock
 * values, not a pre-converted UTC date.
 */
export function computeNatalChart(
  birthDateLocal: Date,
  hours: number,
  minutes: number,
  lat: number = 39.9,
  lon: number = 116.4,
): NatalChart {
  const origin = new Origin({
    year: birthDateLocal.getFullYear(),
    month: birthDateLocal.getMonth(), // 0-indexed, matches JS Date
    date: birthDateLocal.getDate(),
    hour: hours,
    minute: minutes,
    latitude: lat,
    longitude: lon,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: 'whole-sign',
    zodiac: 'tropical',
    aspectPoints: ['bodies', 'points', 'angles'],
    aspectWithPoints: ['bodies', 'points', 'angles'],
    aspectTypes: ['major'],
    customOrbs: {},
    language: 'en',
  });

  const bodiesByKey = new Map<string, any>();
  for (const b of horoscope.CelestialBodies.all) bodiesByKey.set(b.key, b);
  for (const p of horoscope.CelestialPoints.all) bodiesByKey.set(p.key, p);

  const positions: PlanetPosition[] = [];
  for (const key of PLANET_ORDER) {
    const body = bodiesByKey.get(key);
    if (!body) continue;
    const meta = PLANET_META[key];
    const longitude = normalize360(body.ChartPosition.Ecliptic.DecimalDegrees);
    const signKey: string = body.Sign.key;
    const sign = SIGN_BY_KEY[signKey] ?? SIGNS[Math.floor(longitude / 30) % 12];
    positions.push({
      planet: meta.label,
      symbol: meta.symbol,
      longitude,
      sign: sign.name,
      signSymbol: sign.symbol,
      house: body.House?.id ?? 1,
      color: meta.color,
    });
  }

  const ascendant = normalize360(horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees);
  const ascSignKey: string = horoscope.Ascendant.Sign.key;
  const ascSign = SIGN_BY_KEY[ascSignKey] ?? SIGNS[Math.floor(ascendant / 30) % 12];
  const mc = normalize360(horoscope.Midheaven.ChartPosition.Ecliptic.DecimalDegrees);

  positions.unshift({
    planet: 'Ascendant',
    symbol: 'AC',
    longitude: ascendant,
    sign: ascSign.name,
    signSymbol: ascSign.symbol,
    house: 1,
    color: '#FFFFFF',
  });

  // Append MC (Midheaven) as a position so it appears in the Signs list.
  const mcSign = SIGNS[Math.floor(mc / 30) % 12];
  positions.push({
    planet: 'Midheaven',
    symbol: 'MC',
    longitude: mc,
    sign: mcSign.name,
    signSymbol: mcSign.symbol,
    house: 10,
    color: '#FFFFFF',
  });

  // Exclude points that don't form meaningful classical aspects from the
  // aspects calculation: Ascendant (angle, not a body), North Node, Lilith,
  // and Midheaven are intentionally kept out.
  const ASPECT_EXCLUDE = new Set(['Ascendant', 'North Node', 'Lilith', 'Midheaven']);
  const aspects = computeAspects(positions.filter(p => !ASPECT_EXCLUDE.has(p.planet)));

  return { positions, aspects, ascendant, ascendantSign: ascSign.name, mc };
}

function computeAspects(positions: PlanetPosition[]): AstroAspect[] {
  const ASPECT_DEFS = [
    { name: 'Conjunction', angle: 0, orb: 8, harmonious: true },
    { name: 'Sextile', angle: 60, orb: 6, harmonious: true },
    { name: 'Square', angle: 90, orb: 8, harmonious: false },
    { name: 'Trine', angle: 120, orb: 8, harmonious: true },
    { name: 'Opposition', angle: 180, orb: 8, harmonious: false },
  ];

  const aspects: AstroAspect[] = [];
  const majorPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const p1 = positions[i];
      const p2 = positions[j];
      if (!majorPlanets.includes(p1.planet) && !majorPlanets.includes(p2.planet)) continue;
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          aspects.push({
            planet1: p1.planet,
            planet2: p2.planet,
            aspectType: def.name,
            orb: Math.round(orb * 100) / 100,
            isHarmonious: def.harmonious,
            description: getAspectDescription(p1.planet, p2.planet, def.name),
          });
          break;
        }
      }
    }
  }

  // Sort by orb (tightest aspects first)
  return aspects.sort((a, b) => a.orb - b.orb);
}

function getAspectDescription(p1: string, p2: string, aspect: string): string {
  const harmKey = `${p1}_${p2}_${aspect}`;
  const descriptions: Record<string, string> = {
    'Sun_Moon_Conjunction': 'A deeply integrated personality where your will and emotions speak as one. Your sense of purpose and inner needs are aligned.',
    'Sun_Moon_Opposition': 'A tension between your conscious desires and emotional needs creates dynamic energy for growth and understanding.',
    'Sun_Moon_Trine': 'Natural harmony between your outer personality and inner emotional world creates ease and confidence.',
    'Sun_Moon_Square': 'An inner conflict between your ego and emotional needs that pushes you to grow through challenge.',
    'Sun_Moon_Sextile': 'Your mind and heart work in comfortable cooperation, supporting creative expression.',
    'Sun_Venus_Conjunction': 'Natural charm and beauty flow from this placement. You attract love and abundance effortlessly.',
    'Sun_Venus_Trine': 'Grace, creativity, and social magnetism are gifts that come easily to you.',
    'Sun_Mars_Conjunction': 'Dynamic energy and assertive will power give you the drive to achieve your goals with passion.',
    'Sun_Mars_Square': 'Friction between your will and your drive creates powerful motivation, but also tension.',
    'Moon_Venus_Trine': 'Emotional sensitivity and love nature flow together beautifully, making you warm and nurturing.',
    'Moon_Saturn_Opposition': 'Emotional restrictions from early life experiences call you to mature and find inner security.',
    'Venus_Mars_Conjunction': 'Passion and attraction are magnified. You draw others in with magnetic intensity.',
    'Venus_Jupiter_Trine': 'Abundance and joy in love and relationships. Life tends to reward your generous spirit.',
    'Mars_Jupiter_Conjunction': 'Boundless enthusiasm and the drive to expand. You take risks boldly and often succeed.',
    'Jupiter_Saturn_Opposition': 'The tension between optimism and caution teaches you to balance expansion with discipline.',
  };
  return descriptions[harmKey] ?? descriptions[`${p2}_${p1}_${aspect}`] ??
    getGenericAspectDescription(p1, p2, aspect);
}

// Deterministic variant picker — maps a planet-pair key to one of the
// available templates so the same pair always gets the same sentence
// structure but different pairs get different ones.
function pickVariant<T>(arr: T[], key: string): T {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

// Five sentence structures per aspect type for personal aspect descriptions.
// Different planet pairs resolve to different structures via pickVariant.
type OpenerFn = (p1: string, p2: string, d1: string, d2: string) => string;
const ASPECT_OPENER_VARIANTS: Record<string, OpenerFn[]> = {
  Conjunction: [
    (p1, p2, d1, d2) => `${p1} and ${p2} are closely fused in your chart — ${d1} and ${d2} run in the same current.`,
    (p1, p2, d1, d2) => `A conjunction between ${p1} and ${p2} means ${d1} and ${d2} are nearly inseparable in practice.`,
    (p1, p2, d1, d2) => `${p1} and ${p2} converge here — ${d1} and ${d2} operate as a single, amplified force.`,
    (p1, p2, d1, d2) => `Where ${p1} meets ${p2} in your chart, ${d1} and ${d2} collapse into one another.`,
    (p1, p2, d1, d2) => `${p1} sits tightly alongside ${p2} — ${d1} is entangled with ${d2} in ways that are hard to separate.`,
  ],
  Sextile: [
    (p1, p2, d1, d2) => `${p1} and ${p2} are in cooperative alignment — ${d1} has a natural opening toward ${d2}.`,
    (p1, p2, d1, d2) => `A sextile links ${p1} and ${p2} in your chart — ${d1} and ${d2} are on good speaking terms.`,
    (p1, p2, d1, d2) => `${p1} and ${p2} are in comfortable rapport — ${d1} finds real support in ${d2}.`,
    (p1, p2, d1, d2) => `Where ${p1} and ${p2} meet in a sextile, ${d1} and ${d2} tend to cooperate rather than compete.`,
    (p1, p2, d1, d2) => `${p1} and ${p2} offer each other an easy opening — ${d1} and ${d2} work together when you choose to engage them.`,
  ],
  Square: [
    (p1, p2, d1, d2) => `${p1} and ${p2} are at cross-purposes in your chart — ${d1} keeps running up against ${d2}.`,
    (p1, p2, d1, d2) => `A square between ${p1} and ${p2} means ${d1} and ${d2} push against each other.`,
    (p1, p2, d1, d2) => `${p1} squares ${p2} in your chart — ${d1} and ${d2} are in ongoing, productive friction.`,
    (p1, p2, d1, d2) => `Where ${p1} and ${p2} meet, ${d1} does not sit comfortably alongside ${d2}.`,
    (p1, p2, d1, d2) => `${p1} and ${p2} pull against each other — ${d1} and ${d2} keep meeting resistance in your chart.`,
  ],
  Trine: [
    (p1, p2, d1, d2) => `${p1} and ${p2} move in the same current — ${d1} and ${d2} reinforce each other naturally.`,
    (p1, p2, d1, d2) => `A trine links ${p1} and ${p2} in your chart — ${d1} and ${d2} flow together without friction.`,
    (p1, p2, d1, d2) => `${p1} and ${p2} are in natural accord — ${d1} finds real ease in ${d2}.`,
    (p1, p2, d1, d2) => `Where ${p1} and ${p2} meet in a trine, ${d1} and ${d2} work together effortlessly.`,
    (p1, p2, d1, d2) => `${p1} and ${p2} are in effortless alignment here — ${d1} and ${d2} move together as a matter of course.`,
  ],
  Opposition: [
    (p1, p2, d1, d2) => `${p1} and ${p2} pull in opposite directions — ${d1} and ${d2} are the two poles of a real internal tension.`,
    (p1, p2, d1, d2) => `An opposition between ${p1} and ${p2} means ${d1} and ${d2} keep pulling against each other.`,
    (p1, p2, d1, d2) => `${p1} and ${p2} sit at opposite ends of your chart — ${d1} and ${d2} tend to destabilize each other.`,
    (p1, p2, d1, d2) => `Where ${p1} opposes ${p2}, ${d1} pulls one way while ${d2} pulls the other.`,
    (p1, p2, d1, d2) => `${p1} and ${p2} are in opposition here — ${d1} and ${d2} keep swapping which one gets the upper hand.`,
  ],
};

// Per-planet closings keyed [aspectType][p2] — each combination gets its own
// ending so no two aspect readings finish on the same sentence.
const ASPECT_CLOSING: Record<string, Record<string, string>> = {
  Conjunction: {
    Sun:     'The two themes become almost inseparable — amplifying and coloring each other in equal measure.',
    Moon:    'Feeling and intent stop operating separately. They tend to arrive together, for better or worse.',
    Mercury: 'Purpose and thought push in exactly the same direction, which concentrates the energy considerably.',
    Venus:   'Desire and value speak the same language here — powerful when aimed well, harder to moderate when not.',
    Mars:    'Will and action are fused. The intensity is direct, and there is not much tempering it.',
    Jupiter: 'Growth and expansion reinforce each other without friction — which tends to produce genuine abundance.',
    Saturn:  'Structure shapes every expression of this energy, whether you consciously invite it or not.',
    Uranus:  'The conventional gets disrupted at the source. Change arrives before it is asked for.',
    Neptune: 'Imagination and reality blur into each other here — which is both the gift and the hazard of this pairing.',
    Pluto:   'Something in this combination runs at a depth that other people sense before you name it.',
  },
  Sextile: {
    Sun:     'A natural opening exists — the two themes support each other whenever you choose to engage them together.',
    Moon:    'Feeling and intention cooperate more easily than they clash, which makes this one of the more workable placements.',
    Mercury: 'Ideas arrive in forms you can actually use — the instinctive and the analytical are on speaking terms here.',
    Venus:   'Ease in love and creative expression is built into this placement, though it rewards engagement over assumption.',
    Mars:    'Energy tends to be available when you need it, without the friction that usually accompanies ambition.',
    Jupiter: 'Opportunity moves through this channel — the question is whether you go out to meet it or wait for it to arrive.',
    Saturn:  'Discipline here feels chosen rather than imposed, which is what makes it actually sustainable.',
    Uranus:  'Change arrives as possibility rather than disruption — a rarer quality than it might seem.',
    Neptune: 'Intuition and imagination are genuinely accessible here when you reach for them, not only when they choose to surface.',
    Pluto:   'Real depth is available without the usual cost — worth engaging rather than saving for a more urgent moment.',
  },
  Square: {
    Sun:     'The push between these two drives is where a significant amount of your actual development happens.',
    Moon:    'What you want and what you feel do not naturally align — and learning to work with that gap is where self-knowledge grows.',
    Mercury: 'Thought and instinct do not naturally cooperate, which makes this one of the more interesting tensions in the chart.',
    Venus:   'Desire and purpose rub against each other. The discomfort is real, and so is what gets built by working through it.',
    Mars:    'Drive and resistance keep meeting each other. The energy is enormous when channeled well and combustible when not.',
    Jupiter: 'Optimism and caution keep pulling in different directions — which tends to produce more honest decisions than either alone would.',
    Saturn:  'Ambition meets limits, and the limits are usually pointing at something real. The discipline built through this friction tends to last.',
    Uranus:  'Stability and disruption keep interrupting each other. Learning to use the instability productively is the ongoing task.',
    Neptune: 'Clarity and confusion trade places regularly. Staying honest with yourself about which is which is the central work here.',
    Pluto:   'Power and resistance arrive together. What survives the pressure tends to be worth keeping.',
  },
  Trine: {
    Sun:     'The two themes move in the same current — one of the more naturally integrated parts of the chart.',
    Moon:    'Feeling and purpose point in the same direction — a genuine ease worth appreciating rather than simply assuming.',
    Mercury: 'Thought and intent align without effort. The fluency is real; taking it for granted is the only real risk.',
    Venus:   'Harmony and creative ease flow naturally here. What the placement gives, complacency quietly undoes over time.',
    Mars:    'Purpose and energy move together — a genuine asset that works best when engaged consciously rather than coasted on.',
    Jupiter: 'Confidence and opportunity tend to arrive together through this pairing. The gift compounds when used.',
    Saturn:  'Structure supports rather than constrains here, which means the discipline sticks and produces something lasting.',
    Uranus:  'Originality sits in easy reach. The unconventional feels native rather than performed.',
    Neptune: 'Imagination and sensitivity are genuine resources in this combination — not just passing moods.',
    Pluto:   'Depth and transformation are available without the usual cost. Worth using deliberately rather than saving for later.',
  },
  Opposition: {
    Sun:     'Two strong currents pull in opposite directions — and what is asked is learning to hold both rather than letting one win.',
    Moon:    'The space between what you show and what you feel is where a lot of the internal work with this placement happens.',
    Mercury: 'Thought and instinct keep pulling against each other — uncomfortable at times, and a reliable source of insight when you stay with it.',
    Venus:   'What you want and what draws you in keep sitting on opposite ends of the room. Navigating the distance between them is the ongoing work.',
    Mars:    'Direction and drive keep undermining each other until they learn to negotiate. When they do, the result is more balanced than either alone.',
    Jupiter: 'Optimism and realism trade positions regularly — and the tension between them is where most of the useful decisions get made.',
    Saturn:  'Freedom and structure keep interrupting each other. The conversation between them is worth having, even when it is not comfortable.',
    Uranus:  'The conventional and the unconventional pull in opposite directions, which keeps everything from settling too comfortably in one place.',
    Neptune: 'The real and the imagined keep shifting positions — which makes this one of the richer, if more disorienting, tensions to sit with.',
    Pluto:   'Power and surrender take turns. Moving between the two without turning it into a contest is what this placement keeps asking for.',
  },
};

const ASPECT_CLOSING_DEFAULT: Record<string, string> = {
  Conjunction: 'The two themes are inseparable here — amplifying and coloring each other in equal measure.',
  Sextile:     'A natural opening exists between these themes. The question is whether you go to meet it.',
  Square:      'The tension is real and productive. What gets built by working through it tends to be sturdier than what comes easily.',
  Trine:       'Natural ease runs through this pairing — a genuine gift that works best when engaged rather than assumed.',
  Opposition:  'Two currents pull in opposite directions. Integration — not resolution — is what this placement asks for.',
};

function getGenericAspectDescription(p1: string, p2: string, aspect: string): string {
  const d1 = PLANET_DOMAIN[p1]?.domain ?? `the themes ${p1} governs`;
  const d2 = PLANET_DOMAIN[p2]?.domain ?? `the themes ${p2} governs`;
  const variants = ASPECT_OPENER_VARIANTS[aspect];
  const opener = variants
    ? pickVariant(variants, `${p1}_${p2}`)(p1, p2, d1, d2)
    : `${p1} and ${p2} are connected in your chart — ${d1} and ${d2} are in dialogue.`;
  const closing = ASPECT_CLOSING[aspect]?.[p2] ?? ASPECT_CLOSING_DEFAULT[aspect] ?? 'This combination asks you to integrate both planetary themes rather than let one dominate.';
  return `${opener} ${closing}`;
}

// ─── Interpretation Texts ─────────────────────────────────────────────────────
const PLANET_IN_SIGN: Record<string, Record<string, string>> = {
  Ascendant: {
    Aries: 'Aries rising hits the room before you say a word. You come across as direct, self-assured, and a little impatient — someone who would rather act first and recalibrate later. There is movement around you that others notice immediately.',
    Taurus: 'There is something unhurried and grounding about Taurus rising. People find you reliable, physically present, and quietly sensual. You give the impression that whatever happens, you will not be rattled — and that sense of solidity draws people in.',
    Gemini: 'With Gemini rising you adapt instantly to whoever you are with. Quick-minded, curious, sociable — conversations feel easy around you, and people often find you younger-seeming than your age. Your energy shifts depending on who is in the room.',
    Cancer: 'Cancer rising wraps everything in emotional sensitivity. You instinctively read the room, people feel cared for in your presence, and your face tends to carry what you feel before you decide to share it. The personal is always close to the surface.',
    Leo: 'Leo rising walks in with quiet authority. There is warmth and a certain presence that draws eyes naturally — not because you demand attention, but because you take up space confidently. Generosity lands as part of the first impression.',
    Virgo: 'Virgo rising gives a composed, careful first impression. You come across as competent and discerning, someone who has already noticed what needs improving. Others sense you are paying close attention, even when you say nothing.',
    Libra: 'Libra rising is naturally charming without seeming to try. You present as fair, considered, and aesthetically aware — the kind of person who smooths friction just by being present. Graciousness is your default mode.',
    Scorpio: 'Scorpio rising carries a stillness that unsettles people in interesting ways. You do not give much away, which makes others project meaning onto you. The intensity is real — it lives just beneath whatever surface you choose to show.',
    Sagittarius: 'With Sagittarius rising you come across as expansive, good-humored, and refreshingly direct. People sense someone who is going somewhere and would gladly take them along. Freedom is written into your body language.',
    Capricorn: 'Capricorn rising gives a composed, capable first impression even when you feel otherwise. You tend to seem older than your age early on, more fully yourself later. Authority lands on you before you ask for it.',
    Aquarius: 'Aquarius rising makes you instantly readable as someone outside the usual mold. You seem detached in a way that is intriguing rather than cold — clearly thinking ahead of whatever room you are in. Unusual in a way others cannot quite name.',
    Pisces: 'Pisces rising gives a soft, slightly unfocused quality to your presence — not uncertain, just porous. People feel they can bring things to you. The line between your feelings and those of the people around you is thinner than you sometimes realize.',
  },
  Sun: {
    Aries: 'There is an urgency to you — a need to be in motion, to initiate, to arrive first. Courage is instinctive rather than calculated, and challenges tend to energize rather than deplete. You do not wait for conditions to be perfect.',
    Taurus: 'Permanence matters in a deep way. You build slowly and deliberately, with attention to what will last — your identity runs through what you make, own, and genuinely enjoy. Patient until you are not, and then unmovable.',
    Gemini: 'Your mind is rarely quiet. You live in the space between ideas, between people, between questions not yet fully answered. Identity is shaped through curiosity and connection, and you need more variety than most people around you realize.',
    Cancer: 'The personal is everything. Not sentimental so much as protective — of the people, memories, and spaces that feel like home. You feel things before you understand them, and your instincts about people are rarely wrong.',
    Leo: 'Leo Sun needs to matter — not in an ego sense, but in the sense that your creativity, your love, your presence should count for something real. Warmth is your native mode. When you are truly yourself, the people around you feel it.',
    Virgo: 'You notice what others walk past. Your sense of purpose lives in precision, in improvement, in the gap between how things are and how they could be. Service is not a sacrifice — it is what makes you feel most alive.',
    Libra: 'An awareness of others shapes almost everything. You define yourself through relationship, through dialogue, through the attempt to be fair. Beauty and balance are not aesthetic preferences — they are genuine needs.',
    Scorpio: 'Everything runs deep. You are drawn toward what is hidden, complicated, or transformative — not from morbidity but from hunger for what is actually true. Loss and renewal are written into your identity in ways that take time to understand.',
    Sagittarius: 'The horizon is always more interesting than where you just arrived. You need meaning and find it through ideas, movement, and the attempt to understand why things are the way they are. The optimism feels almost structural.',
    Capricorn: 'You understand that some things take time. Capricorn Sun is not driven by urgency but by the knowledge that real things are built slowly. Achievement matters — not as decoration, but as proof of what sustained effort can actually do.',
    Aquarius: 'You have always felt slightly apart from whatever is happening around you, and that distance is where your best thinking happens. You identify with the collective while remaining stubbornly individual — and you care about ideas the way others care about people.',
    Pisces: 'The membrane between you and the world is thinner than for most. You absorb moods, atmospheres, suffering, beauty — often before you know the source. Imagination reaches places that feel genuinely otherworldly. The challenge is staying anchored enough to do something with it.',
  },
  Moon: {
    Aries: 'Emotionally, you move fast. Feelings arrive at full intensity and — if you let them — leave just as quickly. You need freedom to react, to assert, to act on what you feel rather than sit with it in silence.',
    Taurus: 'Emotional safety means stability: familiar people, reliable rhythms, pleasures you trust. Your feelings run deep but do not shift easily. Change in your emotional landscape lands with a weight that can be hard to explain to others.',
    Gemini: 'You process feelings by talking them through — or thinking them to pieces. Emotion is easier when you can name it, share it, place it in context. You need your inner world to be as interesting and mobile as your outer one.',
    Cancer: 'You feel things at full strength, and you remember everything. Powerful instincts, deep loyalties, and an emotional memory that keeps very good records. Sanctuary — physical or relational — is not a luxury for you, it is a requirement.',
    Leo: 'You feel most yourself when your feelings are witnessed. Warmth returned — appreciation, affection, creative recognition — is not vanity, it is sustenance. When those things are present you are generous beyond measure. When absent, there is a particular quiet.',
    Virgo: 'When something is wrong emotionally, you want to understand why — and then fix it. Analysis as self-soothing can tip into anxiety if left unchecked. You feel most settled when your environment is ordered and your contributions are visible to someone.',
    Libra: 'Emotional peace comes through connection and accord. Conflict leaves a residue. You can end up managing others\u2019 moods at the expense of attending to your own, so quietly it takes a while to notice.',
    Scorpio: 'Your emotional life does not stay near the surface for long. You feel at a depth that can be overwhelming — one of the most intense placements in the chart. Intimacy is everything; surface connection is almost worse than none at all.',
    Sagittarius: 'You feel most alive when you are free — free to explore, to believe, to move. Tight emotional spaces breed restlessness. Humor and philosophy are genuine coping mechanisms here, not deflections.',
    Capricorn: 'Feelings are kept managed and often private. You tend to experience vulnerability as exposure, and structure as a form of safety. Emotional growth asks you, more than most, to recognize that need is not weakness.',
    Aquarius: 'You feel things more than you let on — but from a slight remove, as though observing yourself having emotions. More comfortable with ideas about feeling than with feeling itself. Community and friendship are the emotional bedrock, even when love feels complicated.',
    Pisces: 'The emotional world has no clear edges. You absorb what everyone around you is feeling, often without knowing the source. Solitude is not loneliness — it is recovery. You need it more than most, and more often than you admit.',
  },
};

const PLANET_IN_HOUSE: Record<string, Record<number, string>> = {
  Sun: {
    1: 'Your presence is your statement. Identity and appearance pull in the same direction — people see who you are more directly than with most placements. First impressions are something you make consciously or not at all.',
    2: 'Your sense of self is inseparable from what you have built and what you value. Security is not just practical here — it is existential. You need to feel that your resources, skills, and material world are genuinely your own.',
    3: 'Ideas and words are where you come alive. Communication sits at the center of identity — writing, speaking, teaching, or simply being the person in the room who frames things clearly. The mind is a source of real pride.',
    4: 'Your most authentic self lives at home — not necessarily the physical place, but in the domain of family, memory, and private foundation. Your public face is rarely the realest one.',
    5: 'Creativity and joy are not extras — they are where your sense of self resides. Play, romance, and making things are not hobbies. They are how you remember who you are.',
    6: 'You find yourself through work. Identity lives in craft, in daily discipline, in being genuinely useful. There is real pride in doing something well, and the body tends to be a central concern — positively or otherwise.',
    7: 'Partnership is where you become fully yourself. Significant one-on-one relationships are not a supplement to life but the place where identity gets tested, reflected, and clarified.',
    8: 'You are drawn to what other people avoid looking at. Identity lives in transformation, in what survives loss, in the parts of life that are powerful precisely because they cannot be controlled.',
    9: 'Your sense of self expands with distance — physical or intellectual. Travel, philosophy, and learning are not pastimes. The wider the horizon, the more yourself you feel.',
    10: 'Made for visibility. Identity lives in the public realm — reputation, accomplishment, the role you play in the world. Whether you seek it or not, being seen is written into your chart.',
    11: 'Your sense of self is bound up in the collective — friends, communities, causes. Purpose is found in what can be built together rather than alone. Your social world is not background. It is the story.',
    12: 'Much of who you are operates beneath visibility — yours and others\u2019. Your deepest work happens in solitude, in imagination, in spaces that do not appear on any resume. Spirituality and the hidden life are not escapes. They are the core.',
  },
  Moon: {
    1: 'Your emotional state is visible — not because you choose to share it, but because your face and body carry it before you decide. You are emotionally responsive to your environment in ways others immediately notice.',
    2: 'Material and emotional security are the same thing. Financial instability is not just inconvenient — it genuinely unsettles your inner world. Comfort and possessions carry emotional weight that runs deeper than practicality.',
    3: 'Conversation is your therapy. Emotion is processed through language — talking it through, writing it down, thinking it to pieces. Silence when things are emotionally charged is harder on you than most.',
    4: 'Home is where your emotional center of gravity lives. You need a genuine sanctuary — a place or relationship that feels private, safe, and truly yours. Without it, something essential is missing.',
    5: 'Emotional wellbeing is tied directly to creative expression and play. Romance, joy, and the space to make things are not just interests — they nourish something deep that routine alone cannot reach.',
    6: 'Work is how you care for yourself. Emotional equilibrium comes through routine, usefulness, and the satisfaction of doing something well. Disorder in daily habits becomes disorder in your inner life.',
    7: 'You regulate emotionally through relationship. A close, reliable partnership is not dependence — it is the mirror in which your inner life makes most sense. Its absence is genuinely felt.',
    8: 'Your emotional life is not shallow water. You experience feeling at a depth that can be destabilizing without the right support. Intimacy, transformation, and loss tend to reshape you in ways that are permanent.',
    9: 'Freedom and meaning are your emotional requirements. You feel most alive when exploring — physically, intellectually, or spiritually. Emotional constriction often shows up as a restlessness you mistake for something else.',
    10: 'Your emotional life is unusually tangled up in how the world sees you. Professional recognition — or its absence — lands with a weight that surprises you. Public life affects your inner life more than you might readily admit.',
    11: 'Your emotional home is in community. Genuine nourishment comes from friendship and belonging to groups with shared purpose. Emotional isolation is particularly difficult here — you need your people.',
    12: 'Most of your emotional life happens below the surface, and sometimes below your own awareness. You are drawn to solitude, spiritual practice, and the space between waking and sleep. Privacy is not a preference — it is oxygen.',
  },
};

// Fallback content generators for planet/sign and planet/house combinations
// that don't have hand-written entries above (Mercury through Pluto in sign,
// and Mercury through Pluto in house). These are built from what each planet
// actually governs plus the concrete behavioral flavor of each sign/house,
// so they read as substantive interpretations rather than a generic
// "blends the energy of X with Y" template.
const PLANET_DOMAIN: Record<string, { domain: string; verbPhrase: string }> = {
  Sun: { domain: 'your core identity, vitality, and sense of purpose', verbPhrase: 'who you fundamentally are and what you\u2019re here to shine at' },
  Moon: { domain: 'your emotional instincts, comfort needs, and inner world', verbPhrase: 'how you feel safe and what you need to feel at home' },
  Mercury: { domain: 'how you think, learn, and communicate', verbPhrase: 'the way your mind works and how you get your point across' },
  Venus: { domain: 'how you love, what you find beautiful, and what you value', verbPhrase: 'your taste, your affections, and what you\u2019re drawn to' },
  Mars: { domain: 'your drive, ambition, and how you assert yourself', verbPhrase: 'how you go after what you want and how you fight for it' },
  Jupiter: { domain: 'where you seek growth, meaning, and abundance', verbPhrase: 'where you expand, take risks, and look for more' },
  Saturn: { domain: 'where you feel responsibility, meet limits, and build lasting mastery through discipline', verbPhrase: 'where life asks patience and structure of you before it rewards you' },
  Uranus: { domain: 'where you break from convention and seek sudden change or freedom', verbPhrase: 'where you resist being boxed in and crave a jolt of the unexpected' },
  Neptune: { domain: 'your imagination, spirituality, and capacity for both illusion and transcendence', verbPhrase: 'where the line between reality and dream gets porous for you' },
  Pluto: { domain: 'where you undergo deep transformation, confront power, and are ultimately reborn', verbPhrase: 'where something in you has to die before it can be remade, more intensely than anywhere else in your chart' },
  'North Node': { domain: 'your karmic direction and soul-level growth path in this lifetime', verbPhrase: 'where your soul is being called to evolve and stretch beyond its familiar comfort zone' },
  Lilith: { domain: 'your primal power, shadow self, and the part of you that refuses to be tamed or repressed', verbPhrase: 'where raw, untamed energy lives — the part of you that resists domestication and demands to be met on its own terms' },
  Midheaven: { domain: 'your public role, career calling, and how the world sees you at the height of your achievement', verbPhrase: 'the peak of your chart — where worldly ambition, social identity, and your outer reputation converge' },
};

const SIGN_FLAVOR: Record<string, string> = {
  Aries: 'a bold, direct, first-mover energy that would rather act now and adjust later than wait for the perfect plan',
  Taurus: 'a steady, sensual, deliberate energy that resists being rushed and values what can be built to last',
  Gemini: 'a curious, quick, endlessly talkative energy that would rather stay in motion between ideas than settle on just one',
  Cancer: 'a protective, intuitive, emotionally attuned energy that filters everything through feeling and memory',
  Leo: 'a warm, expressive, proud energy that wants what it does to be seen, felt, and remembered',
  Virgo: 'a precise, analytical, improvement-minded energy that notices what\u2019s not working and quietly fixes it',
  Libra: 'a diplomatic, relational, aesthetically tuned energy that weighs both sides and seeks balance before acting',
  Scorpio: 'an intense, private, all-or-nothing energy that goes straight for what\u2019s hidden beneath the surface',
  Sagittarius: 'an expansive, optimistic, restless energy that treats life as one long horizon to keep chasing',
  Capricorn: 'a disciplined, ambitious, patient energy that plays a long game and measures success in what endures',
  Aquarius: 'an independent, unconventional, future-facing energy that would rather be right than be liked',
  Pisces: 'a dreamy, empathetic, boundary-blurring energy that absorbs the emotional weather of everyone nearby',
};

const HOUSE_FLAVOR: Record<number, string> = {
  1: 'your self-image, body, and the first impression you make on the world',
  2: 'money, possessions, and your sense of self-worth',
  3: 'everyday communication, siblings, and how you take in and pass along information',
  4: 'home, family, and your emotional roots',
  5: 'creativity, romance, and how you play and express yourself',
  6: 'daily routines, work habits, and physical health',
  7: 'one-on-one partnerships, including marriage and close alliances',
  8: 'shared resources, intimacy, and deep transformation',
  9: 'belief systems, higher learning, and long-distance travel',
  10: 'career, public reputation, and your role in the world',
  11: 'friendships, communities, and the future you\u2019re working toward',
  12: 'the subconscious, solitude, and whatever stays hidden until it can\u2019t be ignored',
};

// Sign-specific closing lines for the sign fallback — each sign gets its own
// ending so no two interpretations read identically.
const SIGN_CLOSING: Record<string, string> = {
  Aries:       'The instinct to act and assert arrives before deliberation does — which can be a strength or a liability, depending on the moment.',
  Taurus:      'Patience, persistence, and a loyalty to what lasts are the operating mode. Change happens slowly and for good reason.',
  Gemini:      'Variety and mental agility run through everything. Consistency is harder to find here than curiosity.',
  Cancer:      'Emotional attunement shapes the whole picture. What feels safe and familiar pulls just as strongly as what makes rational sense.',
  Leo:         'Warmth and the need for what is done to mean something — to be felt, remembered, recognized — run underneath everything.',
  Virgo:       'The drive to refine, improve, and get it right runs through everything. The standard is high, even when it is quietly held.',
  Libra:       'Other people, their needs, and the weight of getting it fair all factor in before anything is decided.',
  Scorpio:     'Intensity and depth are the operating mode. Surface-level answers are rarely enough — and rarely trusted.',
  Sagittarius: 'Enthusiasm and the pull toward more — more meaning, more distance, more understanding — shape how this energy moves.',
  Capricorn:   'Long-term thinking and the question of what will actually hold up over time run underneath everything.',
  Aquarius:    'Originality and the drive to do things differently tend to override convention, even when convention would be easier.',
  Pisces:      'Sensitivity and a certain permeability to the emotional atmosphere around you color everything here.',
};

export function getPlanetSignInterpretation(planet: string, sign: string): string {
  const hardcoded = PLANET_IN_SIGN[planet]?.[sign];
  if (hardcoded) return hardcoded;
  const planetInfo = PLANET_DOMAIN[planet];
  const flavor = SIGN_FLAVOR[sign];
  if (planetInfo && flavor) {
    const { verbPhrase } = planetInfo;
    const closing = SIGN_CLOSING[sign] ?? `${sign}\u2019s instincts run through this placement, coloring how ${planet}\u2019s themes show up in practice.`;
    return `${sign} shapes ${verbPhrase} — and ${sign} carries ${flavor}. ${closing}`;
  }
  return `${planet} in ${sign} \u2014 ${planet}\u2019s themes take on the character of ${sign}, leaving a distinct mark on how this part of the chart operates.`;
}

// Planet-specific closing lines for the house fallback — each planet gets its
// own ending so no two interpretations read identically.
const PLANET_HOUSE_CLOSING: Record<string, string> = {
  Mercury: 'The way your mind works — and how you communicate — takes its shape from the rhythms and relationships of this part of life.',
  Venus: 'What you love, what you find beautiful, and who you are drawn to all find their most natural expression through this arena.',
  Mars: 'Your drive and assertiveness have a particular outlet here — where action, effort, and desire tend to concentrate.',
  Jupiter: 'Growth and good fortune arrive most reliably through this door. It is where optimism pays off, and where reaching further usually yields something.',
  Saturn: 'This is where life asks patience and seriousness before it rewards you. The discipline is real — so is the mastery that eventually follows.',
  Uranus: 'Disruption, originality, and the unexpected tend to arrive through this part of life. Stability in this area is rarely the point.',
  Neptune: 'Imagination and idealism pool here — as does a certain tendency toward blur or confusion. The spiritual and the illusory arrive through the same channel.',
  Pluto: 'Power and transformation concentrate in this arena. What happens here tends to be permanent — endings that become the ground for something entirely new.',
  'North Node': 'This is the direction your growth is pointing. It may feel unfamiliar, even uncomfortable — which is usually a sign you are moving the right way.',
  Lilith: 'Something raw and uncompromising lives in this part of your chart — a refusal to shrink that is worth understanding on its own terms.',
  Midheaven: 'Your public identity and sense of calling converge here. It is less about what you do and more about what you are recognized for.',
};

export function getPlanetHouseInterpretation(planet: string, house: number): string {
  const hardcoded = PLANET_IN_HOUSE[planet]?.[house];
  if (hardcoded) return hardcoded;
  const planetInfo = PLANET_DOMAIN[planet];
  const flavor = HOUSE_FLAVOR[house];
  if (planetInfo && flavor) {
    const closing = PLANET_HOUSE_CLOSING[planet] ?? `${planet}\u2019s concerns keep surfacing here, through the specific circumstances this part of life brings.`;
    return `The ${house}${getOrdinalSuffix(house)} House \u2014 the arena of ${flavor} \u2014 is where ${planetInfo.domain} becomes most tangible. ${closing}`;
  }
  return `${planet} in the ${house}${getOrdinalSuffix(house)} House \u2014 ${planet}\u2019s energy lands in this particular domain, shaping how you experience and move through that area of life.`;
}

export function getOrdinalSuffix(n: number): string {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}

export function getSunSign(birthDate: Date): string {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Aries';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Taurus';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Gemini';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Cancer';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Leo';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Virgo';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Libra';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Scorpio';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Sagittarius';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Capricorn';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Aquarius';
  return 'Pisces';
}

// Compatibility: compute cross-chart aspects
export function computeCompatibilityAspects(
  chart1: NatalChart,
  name1: string,
  chart2: NatalChart,
  name2: string,
): { positive: AstroAspect[]; negative: AstroAspect[] } {
  const ASPECT_DEFS = [
    { name: 'Conjunction', angle: 0, orb: 7, harmonious: true },
    { name: 'Sextile', angle: 60, orb: 5, harmonious: true },
    { name: 'Square', angle: 90, orb: 7, harmonious: false },
    { name: 'Trine', angle: 120, orb: 7, harmonious: true },
    { name: 'Opposition', angle: 180, orb: 7, harmonious: false },
  ];

  const majorPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter'];
  const all: AstroAspect[] = [];

  for (const p1 of chart1.positions) {
    if (!majorPlanets.includes(p1.planet)) continue;
    for (const p2 of chart2.positions) {
      if (!majorPlanets.includes(p2.planet)) continue;
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(diff - def.angle);
        if (orb <= def.orb) {
          all.push({
            planet1: `${name1}'s ${p1.planet}`,
            planet2: `${name2}'s ${p2.planet}`,
            aspectType: def.name,
            orb: Math.round(orb * 100) / 100,
            isHarmonious: def.harmonious,
            description: getCompatibilityAspectDescription(name1, p1.planet, name2, p2.planet, def.name),
          });
          break;
        }
      }
    }
  }

  // Bigger orb first (least exact aspects lead) — matches the display order
  // requested for the Compatibility tab's Harmonious/Growth Areas lists.
  all.sort((a, b) => b.orb - a.orb);
  return {
    positive: all.filter(a => a.isHarmonious),
    negative: all.filter(a => !a.isHarmonious),
  };
}

// Per-planet closings for the compatibility fallback — keyed [aspectType][p2].
// Each planet-pair/aspect combo gets its own ending so no two readings in
// Harmonious or Growth Areas finish on the same sentence.
const COMPAT_CLOSING: Record<string, Record<string, string>> = {
  Conjunction: {
    Sun:     'Where your directions overlap, you reinforce each other — a bond, and occasionally a shared blind spot worth watching.',
    Moon:    'Emotional attunement runs naturally through this connection — you often feel what the other is carrying before it is said.',
    Mercury: 'The way you each think tends to click into place, which makes genuine conversation easier between you than it is for most.',
    Venus:   'What you each value and find beautiful overlaps enough to create real ease in how you receive each other.',
    Mars:    'Drive and desire move in sync — which amplifies momentum in both directions and asks some care with direction.',
    Jupiter: 'A shared appetite for growth and possibility runs through this connection, which tends to feed optimism in both of you.',
    Saturn:  'Expectation and structure align between you — which can feel, at its best, like being genuinely understood.',
    Uranus:  'A shared tolerance — even appetite — for disruption and change runs through how you operate together.',
    Neptune: 'Imagination and emotional sensitivity run in parallel between you, creating a particular kind of wordless intimacy.',
    Pluto:   'Something in the dynamic between you operates at a depth that neither of you fully controls.',
  },
  Sextile: {
    Sun:     'Your individual directions support rather than undermine each other — room for both without competition.',
    Moon:    'Emotional cooperation comes more easily here than either of you might expect — a quiet ease that is worth noticing.',
    Mercury: 'The way you each think and communicate creates openings between you rather than walls.',
    Venus:   'Affection and appreciation flow without much effort — each of you tends to register what the other brings.',
    Mars:    'Energy and initiative tend to arrive at compatible moments, which makes moving in the same direction feel natural.',
    Jupiter: 'A natural encouragement runs through this connection — each of you tends to bring out the other\'s confidence.',
    Saturn:  'Reliability and consistency flow between you with less friction than in most connections.',
    Uranus:  'Room for surprise and change is built into this relationship — and it tends to be the energizing kind rather than the destabilizing kind.',
    Neptune: 'Empathy flows between you without needing explanation — a genuine resource that is easy to undervalue.',
    Pluto:   'Real depth is accessible between you when either of you chooses to go there.',
  },
  Square: {
    Sun:     'Your individual directions keep running into each other — which produces friction, and sometimes genuine growth from having to reckon with the difference.',
    Moon:    'Emotional needs sit at different angles between you. The misunderstanding is real, and so is the understanding that comes from working through it.',
    Mercury: 'How you each think and communicate doesn\'t naturally mesh — which produces friction, and occasionally the most productive conversations you have.',
    Venus:   'What each of you wants from closeness doesn\'t fully overlap, and navigating that gap is where a lot of the relational work lives.',
    Mars:    'Drive and desire keep bumping into each other between you. The energy is real — what matters is what you do with it.',
    Jupiter: 'Optimism and caution fall on different sides, and negotiating who holds which — and when — is something you keep returning to.',
    Saturn:  'Expectation and resistance run in opposite directions between you, which can feel like one person is always meeting a wall the other built.',
    Uranus:  'Stability and disruption tend to fall on different sides of this connection — and each of you tends to represent a different one.',
    Neptune: 'Clarity and confusion share space between you, which asks for more sustained honesty than most pairings require.',
    Pluto:   'Power and control run as undercurrents between you. What surfaces depends on how much each of you is willing to look at it directly.',
  },
  Trine: {
    Sun:     'Your individual directions move in alignment — which creates room for both of you without competition or the need for compromise.',
    Moon:    'Emotional attunement between you is genuine — you tend to feel understood without having to explain yourself.',
    Mercury: 'Conversation flows naturally, and ideas move between you without much resistance or translation.',
    Venus:   'Affection and appreciation are native to this connection — you find it easy to delight in each other without working at it.',
    Mars:    'Energy and initiative move in compatible directions between you, which makes building things together feel natural rather than negotiated.',
    Jupiter: 'A shared confidence and generosity runs through this — one person\'s growth tends to lift the other rather than diminish them.',
    Saturn:  'Reliability and consistency come naturally to this pairing — the kind of quiet ease that makes a connection last.',
    Uranus:  'Space for each other\'s originality is built in — you can be unusual without needing to justify or explain yourselves.',
    Neptune: 'A shared imaginative and emotional frequency runs through this connection — understood between you without being stated.',
    Pluto:   'The connection can hold real depth and honesty between you, more than most pairings are equipped to sustain.',
  },
  Opposition: {
    Sun:     'Your individual directions pull at angles to each other — which can feel like competition or, when you allow it, like genuine balance.',
    Moon:    'Emotional needs sit on opposite ends, which means each of you often holds what the other is missing — generative when you are curious about it, draining when you are not.',
    Mercury: 'You approach thinking and communication from different angles — productive when either of you is genuinely interested in the gap, frustrating when neither is.',
    Venus:   'What each of you wants from love and closeness doesn\'t fully align — and the distance between those wants is where a lot of the relational work lives.',
    Mars:    'Drive and desire pull in different directions between you — and what you do with that tension shapes the character of the whole connection.',
    Jupiter: 'Optimism and realism tend to fall on opposite sides, and the balance you negotiate between them is something you keep revisiting.',
    Saturn:  'Freedom and responsibility keep swapping places in this relationship — and working out the terms of that exchange is ongoing.',
    Uranus:  'Change and stability tend to fall on opposite sides of this connection, and which of you holds which keeps shifting depending on the moment.',
    Neptune: 'The dreamer and the grounded one tend to swap roles between you — and learning to recognise which is which at any given moment is part of the work.',
    Pluto:   'Power and surrender run as a current through this dynamic. Learning to move between them without turning it into a contest is the invitation this connection keeps extending.',
  },
};

const COMPAT_CLOSING_DEFAULT: Record<string, string> = {
  Conjunction: 'The two themes are inseparable between you — amplifying and coloring each other in ways neither of you carries alone.',
  Sextile:     'A natural opening exists between you here — one that rewards engagement over assumption.',
  Square:      'The tension is real. What you build by working through it together tends to be more durable than what comes easily.',
  Trine:       'Natural ease runs through this part of the connection — an asset that works best when engaged consciously.',
  Opposition:  'Two currents pull in opposite directions between you. Integration — not resolution — is the ongoing work.',
};

// Five sentence structures per aspect type for compatibility descriptions.
type CompatOpenerFn = (n1: string, p1: string, n2: string, p2: string, d1: string, d2: string) => string;
const COMPAT_OPENER_VARIANTS: Record<string, CompatOpenerFn[]> = {
  Conjunction: [
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} are closely fused — ${d1} and ${d2} converge directly between you.`,
    (n1, p1, n2, p2, d1, d2) => `A tight bond runs between ${n1}'s ${p1} and ${n2}'s ${p2} — ${d1} lands directly on ${d2} in this connection.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} operate in the same register between you — ${d1} and ${d2} are nearly inseparable.`,
    (n1, p1, n2, p2, d1, d2) => `Where ${n1}'s ${p1} meets ${n2}'s ${p2}, ${d1} and ${d2} collapse into one current.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} sits tightly alongside ${n2}'s ${p2} — ${d1} is closely entangled with ${d2} between you.`,
  ],
  Sextile: [
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} sit in cooperative alignment — ${d1} and ${d2} find an easy opening between you.`,
    (n1, p1, n2, p2, d1, d2) => `A productive ease runs between ${n1}'s ${p1} and ${n2}'s ${p2} — ${d1} and ${d2} support each other across the connection.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} is in comfortable rapport with ${n2}'s ${p2} — ${d1} finds natural support in ${d2} between you.`,
    (n1, p1, n2, p2, d1, d2) => `Where ${n1}'s ${p1} meets ${n2}'s ${p2}, ${d1} and ${d2} cooperate rather than compete.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} are on good speaking terms — ${d1} and ${d2} move easily together in this connection.`,
  ],
  Trine: [
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} move in the same current between you — ${d1} and ${d2} reinforce each other naturally.`,
    (n1, p1, n2, p2, d1, d2) => `A natural harmony runs between ${n1}'s ${p1} and ${n2}'s ${p2} — ${d1} and ${d2} flow together without friction.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} are in easy accord — ${d1} finds real ease in ${d2} between you.`,
    (n1, p1, n2, p2, d1, d2) => `Where ${n1}'s ${p1} meets ${n2}'s ${p2}, ${d1} and ${d2} work together effortlessly.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} are in natural alignment — ${d1} and ${d2} move together as a matter of course between you.`,
  ],
  Square: [
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} are at cross-purposes — ${d1} and ${d2} keep running up against each other between you.`,
    (n1, p1, n2, p2, d1, d2) => `A productive friction runs between ${n1}'s ${p1} and ${n2}'s ${p2} — ${d1} and ${d2} push against each other across the connection.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} squares ${n2}'s ${p2}: ${d1} and ${d2} are in ongoing tension between you.`,
    (n1, p1, n2, p2, d1, d2) => `Where ${n1}'s ${p1} meets ${n2}'s ${p2}, ${d1} and ${d2} generate friction rather than ease.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} pull against each other — ${d1} and ${d2} meet real resistance between you.`,
  ],
  Opposition: [
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} sit at opposite ends — ${d1} and ${d2} pull in different directions across the connection.`,
    (n1, p1, n2, p2, d1, d2) => `A polarising tension runs between ${n1}'s ${p1} and ${n2}'s ${p2} — ${d1} and ${d2} keep pulling against each other.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} opposes ${n2}'s ${p2}: ${d1} and ${d2} are the two poles of an ongoing tension between you.`,
    (n1, p1, n2, p2, d1, d2) => `Where ${n1}'s ${p1} meets ${n2}'s ${p2}, ${d1} and ${d2} tend to destabilise each other.`,
    (n1, p1, n2, p2, d1, d2) => `${n1}'s ${p1} and ${n2}'s ${p2} pull in opposite directions — ${d1} and ${d2} keep swapping which one gets the upper hand between you.`,
  ],
};

function getCompatibilityAspectDescription(name1: string, p1: string, name2: string, p2: string, aspectName: string): string {
  const d1 = PLANET_DOMAIN[p1]?.domain ?? `what ${p1} represents`;
  const d2 = PLANET_DOMAIN[p2]?.domain ?? `what ${p2} represents`;
  const variants = COMPAT_OPENER_VARIANTS[aspectName];
  const opener = variants
    ? pickVariant(variants, `${p1}_${p2}`)(name1, p1, name2, p2, d1, d2)
    : `${name1}'s ${p1} and ${name2}'s ${p2} are connected — ${d1} and ${d2} are in dialogue between you.`;
  const closing = COMPAT_CLOSING[aspectName]?.[p2] ?? COMPAT_CLOSING_DEFAULT[aspectName] ?? 'This combination asks you to work with the pairing rather than let it run on autopilot.';
  return `${opener} ${closing}`;
}

export function computeNatalChartForProfile(profile: {
  birthDate: string;
  birthTime?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): NatalChart | null {
  const birthDate = new Date(profile.birthDate);
  if (isNaN(birthDate.getTime())) return null;
  const timeParts = (profile.birthTime ?? '12:00').match(/^(\d{1,2}):(\d{2})$/);
  const hours = timeParts ? Math.min(23, parseInt(timeParts[1], 10)) : 12;
  const mins = timeParts ? Math.min(59, parseInt(timeParts[2], 10)) : 0;
  const lat = typeof profile.latitude === 'number' && isFinite(profile.latitude) ? profile.latitude : 39.9;
  const lon = typeof profile.longitude === 'number' && isFinite(profile.longitude) ? profile.longitude : 116.4;
  return computeNatalChart(birthDate, hours, mins, lat, lon);
}

export function formatDegreeMinute(lon: number): string {
  const sign = Math.floor(lon / 30);
  const inSign = lon % 30;
  const deg = Math.floor(inSign);
  const min = Math.floor((inSign - deg) * 60);
  return `${deg}°${min.toString().padStart(2, '0')}'`;
}
