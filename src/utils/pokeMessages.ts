/**
 * Zomato & Swiggy-Style Daily Poke Engine
 * Generates witty, humorous, contextual daily poke notifications and banners
 * to keep users delightfully engaged and motivated to knock out their routines.
 */

export interface PokeMessage {
  id: string;
  emoji: string;
  title: string;
  body: string;
  category: 'morning' | 'afternoon' | 'evening' | 'night' | 'streak' | 'general';
}

const MORNING_POKES = [
  (name: string, _pending: number) => ({
    emoji: '🍳',
    title: 'Breakfast of champions or scrolling in bed?',
    body: `Hey ${name}, your coffee is kicking in. Knock out that first task before you open Instagram again!`,
  }),
  (name: string, pending: number) => ({
    emoji: '☕',
    title: 'Order confirmed: 1 Grande Cup of Focus',
    body: `Estimated delivery for ${name}: Right now. You've got ${pending > 0 ? `${pending} objectives` : 'habits'} lined up today!`,
  }),
  (name: string, _pending: number) => ({
    emoji: '🌅',
    title: 'Rise and grind, superstar!',
    body: `Hey ${name}, your habits missed you more than your warm bed will. Let's make today count!`,
  }),
  (name: string, _pending: number) => ({
    emoji: '🥐',
    title: 'Freshly baked momentum ready!',
    body: `A warm croissant and a checked-off task: name a better morning combo, ${name}.`,
  }),
];

const AFTERNOON_POKES = [
  (name: string, _pending: number) => ({
    emoji: '🍕',
    title: 'Pizza tastes 100x better when tasks are done',
    body: `Just saying, ${name}... 50% discount on guilt if you conquer an objective before lunch slump hits.`,
  }),
  (name: string, pending: number) => ({
    emoji: '⚡',
    title: 'Post-lunch coma is a trap!',
    body: `Hey ${name}, don't let the 3 PM yawns defeat you. ${pending > 0 ? `${pending} items to go!` : 'One tiny checkmark and momentum is yours.'}`,
  }),
  (name: string, pending: number) => ({
    emoji: '🛵',
    title: 'Delivery partner has picked up your focus',
    body: `Heading straight to completion for ${name}! Only ${pending > 0 ? pending : 1} quick steps remaining.`,
  }),
  (name: string, _pending: number) => ({
    emoji: '🥤',
    title: 'Midday hydration & hustle check',
    body: `Drink some water and tick one item off, ${name}. Your future 6 PM self will thank you profusely.`,
  }),
];

const EVENING_POKES = [
  (name: string, _pending: number) => ({
    emoji: '🌙',
    title: 'Netflix can wait 10 mins... let\'s wrap up!',
    body: `Wrap up today's wins now so you can binge that show with zero pending guilt, ${name}.`,
  }),
  (name: string, pending: number) => ({
    emoji: '🌯',
    title: 'Dinner is cooking, and so is your streak!',
    body: `Hey ${name}, don't let the fire go out tonight. ${pending > 0 ? `${pending} tasks pending.` : 'A quick 60-second review secures the bag.'}`,
  }),
  (name: string, _pending: number) => ({
    emoji: '🛋️',
    title: 'The couch won\'t run away!',
    body: `Finish the final lap of the day, ${name}, and claim your royal relaxation evening.`,
  }),
  (name: string, _pending: number) => ({
    emoji: '📱',
    title: 'Your phone called...',
    body: `Hey ${name}, it wants you to mark your daily routine done instead of mindlessly double-tapping memes!`,
  }),
];

const NIGHT_POKES = [
  (name: string, _pending: number) => ({
    emoji: '🛌',
    title: 'Sleep like royalty tonight',
    body: `Nothing feels as soft as a pillow after a day where you actually did what you said you'd do, ${name}.`,
  }),
  (name: string, _pending: number) => ({
    emoji: '⭐',
    title: 'Closing time at Taskify HQ',
    body: `Review today's scorecard, high-five yourself in the mirror, and get that beauty sleep, ${name}.`,
  }),
];

const STREAK_POKES = [
  (name: string, streak: number) => ({
    emoji: '🔥',
    title: `${streak}-Day Flame Alert!`,
    body: `Protect the flame, ${name}! Your streak has a family to feed. Tap to keep the fire raging!`,
  }),
  (_name: string, streak: number) => ({
    emoji: '👑',
    title: `${streak} days in a row? Unstoppable!`,
    body: `Look at you operating at legendary discipline levels. Don't break the golden chain!`,
  }),
];

/**
 * Returns a contextual daily poke message based on the current hour of the day.
 */
export function getDailyPoke(
  userName: string = 'Alex',
  pendingCount: number = 2,
  streakCount: number = 1
): PokeMessage {
  const hour = new Date().getHours();
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );

  // If user has an active streak >= 2 and it's evening, prioritize streak protection
  if (streakCount >= 2 && hour >= 17) {
    const fn = STREAK_POKES[dayOfYear % STREAK_POKES.length];
    const item = fn(userName, streakCount);
    return { id: `streak-${dayOfYear}`, ...item, category: 'streak' };
  }

  if (hour >= 5 && hour < 12) {
    const fn = MORNING_POKES[dayOfYear % MORNING_POKES.length];
    const item = fn(userName, pendingCount);
    return { id: `morning-${dayOfYear}`, ...item, category: 'morning' };
  }

  if (hour >= 12 && hour < 17) {
    const fn = AFTERNOON_POKES[dayOfYear % AFTERNOON_POKES.length];
    const item = fn(userName, pendingCount);
    return { id: `afternoon-${dayOfYear}`, ...item, category: 'afternoon' };
  }

  if (hour >= 17 && hour < 22) {
    const fn = EVENING_POKES[dayOfYear % EVENING_POKES.length];
    const item = fn(userName, pendingCount);
    return { id: `evening-${dayOfYear}`, ...item, category: 'evening' };
  }

  const fn = NIGHT_POKES[dayOfYear % NIGHT_POKES.length];
  const item = fn(userName, pendingCount);
  return { id: `night-${dayOfYear}`, ...item, category: 'night' };
}

/**
 * Returns a randomized poke message when the user requests a new poke.
 */
export function getRandomPoke(
  userName: string = 'Alex',
  pendingCount: number = 2,
  streakCount: number = 1
): PokeMessage {
  const allGenerators = [
    ...MORNING_POKES,
    ...AFTERNOON_POKES,
    ...EVENING_POKES,
    ...NIGHT_POKES,
    ...(streakCount >= 2 ? STREAK_POKES : []),
  ];
  const idx = Math.floor(Math.random() * allGenerators.length);
  const fn = allGenerators[idx];
  const item = (fn as any)(userName, pendingCount > 0 ? pendingCount : streakCount);
  return {
    id: `random-${Date.now()}`,
    ...item,
    category: 'general',
  };
}
