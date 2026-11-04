/**
 * Friendly & Playful Microcopy Utilities
 * Provides randomized, clear deletion confirmation messages
 * and lighthearted validation warnings for empty fields that any normal person
 * can effortlessly understand without obscure internet slang.
 */

export interface GenzDeletePrompt {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
}

const TASK_DELETE_MESSAGES: Array<(name: string) => { title: string; message: string }> = [
  (name) => ({
    title: 'Delete this task?',
    message: `Are you sure you want to delete "${name}"? Once removed, it will disappear from your offline records forever.`,
  }),
  (name) => ({
    title: 'Are you sure you wanna delete this?',
    message: `Heads up: deleting "${name}" is permanent. You won't be able to undo or restore it later!`,
  }),
  (name) => ({
    title: 'Permanent deletion check',
    message: `"${name}" will be erased permanently from your local workspace. Ready to proceed?`,
  }),
  (name) => ({
    title: 'Remove this objective?',
    message: `No take-backsies! "${name}" will be permanently wiped from your task list.`,
  }),
  (name) => ({
    title: 'Delete task forever?',
    message: `Are you positive about removing "${name}"? This action cannot be reversed.`,
  }),
];

const HABIT_DELETE_MESSAGES: Array<(name: string) => { title: string; message: string }> = [
  (name) => ({
    title: 'Delete this routine?',
    message: `Are you sure you want to delete "${name}"? All tracked streak progress for this routine will be removed.`,
  }),
  (name) => ({
    title: 'Remove routine from your day?',
    message: `Heads up: deleting "${name}" will permanently erase its completion history from your workspace.`,
  }),
  (name) => ({
    title: 'Permanent habit deletion',
    message: `Saying goodbye to "${name}"? Once deleted, this routine cannot be restored.`,
  }),
  (name) => ({
    title: 'Are you sure you wanna delete this?',
    message: `"${name}" will be removed forever from your daily habits. Proceed with deletion?`,
  }),
];

const FINANCE_DELETE_MESSAGES: Array<(name: string) => { title: string; message: string }> = [
  (name) => ({
    title: 'Delete this cash record?',
    message: `Are you sure you want to erase "${name}"? Your monthly totals and cashflow stats will recalculate immediately.`,
  }),
  (name) => ({
    title: 'Remove this transaction?',
    message: `Heads up: deleting "${name}" is permanent. This entry will be removed from your offline ledger.`,
  }),
  (name) => ({
    title: 'Delete transaction forever?',
    message: `Are you positive about removing "${name}"? Once erased, this receipt cannot be restored.`,
  }),
  (name) => ({
    title: 'Are you sure you wanna delete this?',
    message: `"${name}" will disappear permanently from your financial log. Proceed?`,
  }),
];

const CONFIRM_CANCEL_PAIRS = [
  { confirmText: 'Delete forever', cancelText: 'Keep it' },
  { confirmText: 'Yes, delete it', cancelText: 'Cancel' },
  { confirmText: 'Delete permanently', cancelText: 'Never mind' },
  { confirmText: 'Delete record', cancelText: 'Keep safe' },
  { confirmText: 'Remove item', cancelText: 'Go back' },
];

/**
 * Returns a randomized, clear deletion prompt customized for the target item.
 */
export function getRandomDeletePrompt(
  itemType: 'task' | 'habit' | 'finance',
  itemName: string
): GenzDeletePrompt {
  const cleanName = itemName.trim() || (itemType === 'task' ? 'this task' : itemType === 'habit' ? 'this routine' : 'this record');
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
 * Friendly validation error messages when a required field is left empty.
 */
const TASK_TITLE_ERRORS = [
  'Hey man, you left this thing alone! Please type a title 😊',
  'Don\'t leave this alone! Enter an objective title to save.',
  'Task title is required! What objective are we conquering?',
  'You left this field empty! Give this task a title first.',
];

const HABIT_NAME_ERRORS = [
  'Hey man, you left this thing alone! Please enter a routine name 😊',
  'Don\'t leave this alone! Name your new routine to begin.',
  'Routine name is required! What habit are we tracking?',
  'You left this field empty! Enter a routine name to continue.',
];

const FINANCE_AMOUNT_ERRORS = [
  'Hey man, you left this thing alone! Enter an amount greater than 0.',
  'Amount cannot be zero! Please enter how much was spent or earned.',
  'Please enter a valid amount to record this transaction.',
  'Amount is missing! Type the transaction value to continue.',
];

const FINANCE_DESC_ERRORS = [
  'Hey man, you left this thing alone! Add a description or merchant.',
  'Please add a brief note or merchant name for this record.',
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
