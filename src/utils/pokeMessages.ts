/**
 * Zomato & Swiggy-Style Daily Poke Engine
 * Generates witty, varied, contextual poke notifications:
 * - If tasks are pending: Nudges user with "Stop doing other things and complete this task!" style prompts.
 * - If all work is completed: Celebrates with "You own this rest!" style reward messages.
 * Ensures notifications rotate dynamically and are never repetitive.
 */

export interface PokeMessage {
  id: string;
  emoji: string;
  title: string;
  body: string;
  category: 'pending_nudge' | 'rest_reward';
}

const PENDING_TASKS_POKES = [
  (name: string, pending: number, topTask?: string) => ({
    emoji: '🛑',
    title: 'Stop doing the other things!',
    body: topTask
      ? `Hey ${name}, put down the distractions and complete "${topTask}"! You've got ${pending} tasks waiting.`
      : `Hey ${name}, stop doing other things and complete this task! You have ${pending} pending objectives waiting.`,
  }),
  (name: string, _pending: number, topTask?: string) => ({
    emoji: '📱',
    title: 'Drop the doomscrolling!',
    body: topTask
      ? `Close those other tabs, ${name}! Lock in on "${topTask}" before procrastination wins.`
      : `Close that other app, ${name}! Knock out your next task before procrastination wins.`,
  }),
  (name: string, pending: number) => ({
    emoji: '⚡',
    title: 'Stop multitasking and lock in!',
    body: `Hey ${name}, stop juggling ten things at once. One task done right now is 100% less stress tonight (${pending} pending).`,
  }),
  (name: string, _pending: number, topTask?: string) => ({
    emoji: '🍕',
    title: 'Work first, pizza later!',
    body: topTask
      ? `50% discount on guilt, ${name}, if you stop other stuff and conquer "${topTask}" right now!`
      : `50% discount on guilt, ${name}, if you stop doing other stuff and conquer your next task right now!`,
  }),
  (name: string, pending: number) => ({
    emoji: '👀',
    title: 'We see you procrastinating...',
    body: `Take 3 minutes, ${name}! Complete this pending task and cross it off before the afternoon slump hits (${pending} left).`,
  }),
  (name: string, pending: number, topTask?: string) => ({
    emoji: '🛵',
    title: 'Priority delivery for your focus!',
    body: topTask
      ? `Your goals won't complete themselves, ${name}! Clear "${topTask}" and claim your momentum.`
      : `Your goals won't complete themselves, ${name}! Knock out this task (${pending} left) and claim your momentum.`,
  }),
  (name: string, pending: number) => ({
    emoji: '🎯',
    title: 'Time to conquer this task!',
    body: `Hey ${name}, drop whatever else you're doing. Knock out one objective right now and feel like a champion (${pending} pending).`,
  }),
];

const ALL_COMPLETED_POKES = [
  (name: string) => ({
    emoji: '🏖️',
    title: 'You own this rest!',
    body: `All work is done, ${name}! Kick back, relax, and enjoy pure zero-guilt chill time.`,
  }),
  (name: string) => ({
    emoji: '👑',
    title: 'Clean sweep, absolute legend!',
    body: `Zero tasks pending, ${name}. You officially own this rest—enjoy your royal evening!`,
  }),
  (name: string) => ({
    emoji: '🍕',
    title: 'Guilt-free relaxation unlocked!',
    body: `Every single objective conquered today, ${name}! Put your feet up, you earned every bit of this.`,
  }),
  (name: string) => ({
    emoji: '🛋️',
    title: 'The throne is yours tonight!',
    body: `Mission fully accomplished, ${name}! Enjoy your evening like royalty with 100% peace of mind.`,
  }),
  (name: string) => ({
    emoji: '✨',
    title: 'Undeniable victory today!',
    body: `Nothing left on your to-do list, ${name}. Sleep like royalty tonight, you own this rest!`,
  }),
  (name: string) => ({
    emoji: '🎉',
    title: 'All clear for the day!',
    body: `Every task is finished, ${name}. Go do whatever you love—you've earned every minute of it!`,
  }),
];

// Memory pointer to ensure successive poke notifications within a session rotate and never repeat
let lastPokeIndex = -1;

/**
 * Returns a customized poke notification that dynamically adapts to pending tasks status:
 * - If tasks are pending: Direct, witty "Stop doing other things & complete this task" prompts.
 * - If all work is completed: Celebratory "You own this rest!" reward prompts.
 */
export function getPokeNotification(
  userName: string = 'Alex',
  pendingCount: number = 0,
  topTaskTitle?: string
): PokeMessage {
  const pool = pendingCount > 0 ? PENDING_TASKS_POKES : ALL_COMPLETED_POKES;
  
  // Advance index to guarantee the notification is never the same as the previous one
  let nextIndex = (lastPokeIndex + 1) % pool.length;
  if (nextIndex === lastPokeIndex && pool.length > 1) {
    nextIndex = (nextIndex + 1) % pool.length;
  }
  lastPokeIndex = nextIndex;

  const fn = pool[nextIndex];
  const item = (fn as any)(userName, pendingCount, topTaskTitle);

  return {
    id: `poke-${Date.now()}-${nextIndex}`,
    ...item,
    category: pendingCount > 0 ? 'pending_nudge' : 'rest_reward',
  };
}

/**
 * Deterministic daily poke generator for background scheduling.
 */
export function getDailyPoke(
  userName: string = 'Alex',
  pendingCount: number = 0,
  _streakCount: number = 1
): PokeMessage {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );

  const pool = pendingCount > 0 ? PENDING_TASKS_POKES : ALL_COMPLETED_POKES;
  const idx = dayOfYear % pool.length;
  const fn = pool[idx];
  const item = (fn as any)(userName, pendingCount);

  return {
    id: `daily-poke-${dayOfYear}`,
    ...item,
    category: pendingCount > 0 ? 'pending_nudge' : 'rest_reward',
  };
}

/**
 * Random poke generator for manual tests and triggers.
 */
export function getRandomPoke(
  userName: string = 'Alex',
  pendingCount: number = 0,
  _streakCount: number = 1
): PokeMessage {
  return getPokeNotification(userName, pendingCount);
}
