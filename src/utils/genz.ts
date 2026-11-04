/**
 * Gen-Z Humorous Microcopy & Validation Utilities
 * Provides randomized, contextual Gen-Z deletion confirmation messages
 * and playful validation warnings for empty fields.
 */

export interface GenzDeletePrompt {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

const TASK_DELETE_MESSAGES: Array<(name: string) => { title: string; message: string }> = [
  (name) => ({
    title: 'Bro really clicked delete...',
    message: `No cap, "${name}" will disappear into the void forever fr fr. Once it's gone even Ctrl+Z cannot clutch this up!`,
  }),
  (name) => ({
    title: 'Whoa bestie, slow down 🛑',
    message: `Deleting "${name}" is giving zero motivation era. Are we really letting this objective perish into thin air?`,
  }),
  (name) => ({
    title: 'Send it to the backrooms?',
    message: `"${name}" is about to be sent straight into the shadow realm. Permanent deletion vibes only!`,
  }),
  (name) => ({
    title: 'Deleting this is crazy 😭',
    message: `Bestie... "${name}" is about to be completely cooked. Zero saves, zero respawns fr!`,
  }),
  (name) => ({
    title: 'Permanent vibe check 💀',
    message: `Yeeting "${name}" into oblivion? Not very demure, not very mindful, but go off I guess.`,
  }),
  (name) => ({
    title: 'Bro about to rage-delete 💀',
    message: `"${name}" is literally begging for mercy rn. Nuke it or spare its life?`,
  }),
  (name) => ({
    title: 'One-way ticket to void 🚀',
    message: `No take-backsies! Once "${name}" logs off, it is gone from local IndexedDB forever.`,
  }),
];

const HABIT_DELETE_MESSAGES: Array<(name: string) => { title: string; message: string }> = [
  (name) => ({
    title: 'Ghosting this routine?! 😭',
    message: `Bestie... are we really ghosting "${name}"? Your streak gains and dopamine levels are crying rn fr fr.`,
  }),
  (name) => ({
    title: 'Dropping the routine is wild 💀',
    message: `Deleting "${name}"? Don't let your self-improvement era fall off like this bestie!`,
  }),
  (name) => ({
    title: 'Streak wiped forever 🛑',
    message: `"${name}" is about to be yeeted into history. All tracked completions will disappear!`,
  }),
  (name) => ({
    title: 'Breaking the discipline arc? 🗿',
    message: `Abandoning "${name}" is not very sigma of you no cap. You 100% sure you wanna erase this habit?`,
  }),
  (name) => ({
    title: 'It is giving quit vibes 💔',
    message: `Say goodbye to "${name}". It was a loyal routine while it lasted. Send it to the graveyard?`,
  }),
];

const FINANCE_DELETE_MESSAGES: Array<(name: string) => { title: string; message: string }> = [
  (name) => ({
    title: 'Wiping the cash record? 💸',
    message: `Erasing "${name}"? In this economy?! The math ain't mathing if we ghost our transactions fr fr.`,
  }),
  (name) => ({
    title: 'Permanent ledger deletion 📉',
    message: `"${name}" will vanish into the digital ether. Your cashflow velocity will adjust immediately!`,
  }),
  (name) => ({
    title: 'Cooked transaction incoming 💀',
    message: `It's giving IRS audit confusion vibes bestie. Yeet "${name}" out of existence?`,
  }),
  (name) => ({
    title: 'Vanishing into thin air 💨',
    message: `Deleting "${name}"? Poof, cash record gone forever. No Ctrl+Z can bring back this receipt!`,
  }),
  (name) => ({
    title: 'Bro erased the evidence 😭',
    message: `Wiping "${name}" off the face of the earth. Proceed with the purge?`,
  }),
];

const CONFIRM_CANCEL_PAIRS = [
  { confirmText: 'Yep, yeet it 💀', cancelText: 'Nope, keep it' },
  { confirmText: 'Send to void 🚀', cancelText: 'Wait my bad' },
  { confirmText: 'Nuke it fr 💥', cancelText: 'Let it cook' },
  { confirmText: 'Cook it 🍳', cancelText: 'Spare its life 🥺' },
  { confirmText: 'Straight to trash 🗑️', cancelText: 'Cancel immediately' },
  { confirmText: 'Yeet to oblivion 💀', cancelText: 'Nah keep safe' },
];

/**
 * Returns a randomized Gen-Z deletion prompt customized for the target item.
 */
export function getRandomDeletePrompt(
  itemType: 'task' | 'habit' | 'finance',
  itemName: string
): GenzDeletePrompt {
  const cleanName = itemName.trim() || (itemType === 'task' ? 'this task' : itemType === 'habit' ? 'this habit' : 'this record');
  let pool = TASK_DELETE_MESSAGES;
  if (itemType === 'habit') pool = HABIT_DELETE_MESSAGES;
  if (itemType === 'finance') pool = FINANCE_DELETE_MESSAGES;

  const randomMsgGen = pool[Math.floor(Math.random() * pool.length)];
  const { title, message } = randomMsgGen(cleanName);
  const pair = CONFIRM_CANCEL_PAIRS[Math.floor(Math.random() * CONFIRM_CANCEL_PAIRS.length)];

  return {
    title,
    message,
    confirmText: pair.confirmText,
    cancelText: pair.cancelText,
  };
}

/**
 * Gen-Z validation error messages when a required field is left empty.
 */
const TASK_TITLE_ERRORS = [
  'Hey man you left this thing alone! 💀 Type a title fr fr.',
  'Bestie you forgot the task title! How we supposed to lock in? 😭',
  'Bro left the title blank and thought we wouldn\'t notice 🗿',
  'Empty title detected! What objective are we conquering today? ✍️',
  'Zero words? That\'s not very demure, not very mindful bestie ✋',
  'Hey man you left this thing alone! Give this task a name no cap 🧢',
];

const HABIT_NAME_ERRORS = [
  'Hey man you left this thing alone! 💀 Name your habit fr fr.',
  'Bestie you forgot to name the routine! What are we building here? 😭',
  'Bro left the habit name blank! The streak can\'t start like this 🗿',
  'Empty routine name! No cap you gotta name the habit first ✍️',
  'Hey man you left this thing alone! Type a routine name bestie 🛑',
];

const FINANCE_AMOUNT_ERRORS = [
  'Hey man you left this thing alone! 💀 Enter an amount > 0.',
  'Zero dollars? In this economy?! Be serious bestie 💸😭',
  'Bro entered $0 and thought it was free real estate 💀',
  'Amount is missing! We can\'t log invisible cash into the vault 💰',
  'Hey man you left this thing alone! Type the cash value fr fr 📈',
];

const FINANCE_DESC_ERRORS = [
  'Hey man you left this thing alone! 💀 Who did you pay?',
  'Bestie you forgot the merchant/description! Where\'d the bread go? 🍞',
  'Bro forgot to describe this transaction! The ledger needs context 🗿',
];

export function getEmptyFieldError(
  context: 'task_title' | 'habit_name' | 'finance_amount' | 'finance_description' | 'general'
): string {
  let pool = TASK_TITLE_ERRORS;
  if (context === 'habit_name') pool = HABIT_NAME_ERRORS;
  if (context === 'finance_amount') pool = FINANCE_AMOUNT_ERRORS;
  if (context === 'finance_description') pool = FINANCE_DESC_ERRORS;

  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
