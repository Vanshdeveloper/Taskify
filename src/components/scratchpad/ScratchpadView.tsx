import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FLUID_SPRINGS } from '../../utils/motion';
import {
  Plus,
  Search,
  Trash2,
  Play,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Pin,
  Check,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  BookOpen,
  FileText,
  Clock,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ScratchCard } from '../../types';
import { feedback } from '../../utils/feedback';
import { getRandomDeletePrompt } from '../../utils/genz';
import { SectionHeader } from '../ui/SectionHeader';

const NOTE_COLORS = [
  { label: 'Terracotta', value: '#f26a36' },
  { label: 'Sky Blue', value: '#38bdf8' },
  { label: 'Matcha', value: '#84cc16' },
  { label: 'Lilac', value: '#c084fc' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f472b6' },
  { label: 'Slate', value: '#94a3b8' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Yellow', color: '#fef08a' },
  { label: 'Coral', color: '#fed7aa' },
  { label: 'Mint', color: '#bbf7d0' },
  { label: 'Sky', color: '#bae6fd' },
  { label: 'Lilac', color: '#e9d5ff' },
  { label: 'Clear', color: 'transparent' },
];

const TEXT_COLORS = [
  { label: 'Black', color: '#000000' },
  { label: 'White', color: '#ffffff' },
  { label: 'Coral', color: '#f26a36' },
  { label: 'Amber', color: '#f59e0b' },
  { label: 'Emerald', color: '#10b981' },
  { label: 'Cyan', color: '#06b6d4' },
  { label: 'Indigo', color: '#818cf8' },
  { label: 'Pink', color: '#f472b6' },
  { label: 'Muted', color: '#a1a1aa' },
];

const FONT_HIERARCHIES = [
  { label: 'Title', tag: 'h1', desc: 'Heading 1' },
  { label: 'Heading', tag: 'h2', desc: 'Heading 2' },
  { label: 'Subhead', tag: 'h3', desc: 'Heading 3' },
  { label: 'Body', tag: 'p', desc: 'Body Text' },
  { label: 'Code', tag: 'pre', desc: 'Code Block' },
];

function formatNoteDate(isoString?: string): string {
  if (!isoString) return 'Just now';
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  if (isYesterday) {
    return 'Yesterday';
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

export const ScratchpadView: React.FC = () => {
  const { scratchCards, addScratchCard, updateScratchCard, deleteScratchCard, bulkDeleteScratchCards, requestDelete } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Active Selected Note ID for Master-Detail View
  const [activeNoteId, setActiveNoteId] = useState<string | null>(() => {
    return scratchCards.length > 0 ? scratchCards[0].id : null;
  });

  // Mobile navigation: drill-down into editor view on small screens
  const [isMobileEditorOpen, setIsMobileEditorOpen] = useState(false);

  // Active note editor buffer (local editable state)
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editBackContent, setEditBackContent] = useState('');
  const [editIsTwoSided, setEditIsTwoSided] = useState(false);
  const [editIsPinned, setEditIsPinned] = useState(false);
  const [editCategory, setEditCategory] = useState('General');
  const [editColor, setEditColor] = useState('#f26a36');

  // Notepad Theme & Fullscreen mode
  const [isDesktopFullscreen, setIsDesktopFullscreen] = useState(false);
  const [paperTheme, setPaperTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('taskify_notepad_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  const togglePaperTheme = useCallback(() => {
    feedback.playClick();
    setPaperTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('taskify_notepad_theme', next);
      } catch {}
      return next;
    });
  }, []);

  // Exit fullscreen on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDesktopFullscreen) {
        setIsDesktopFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktopFullscreen]);

  // Multi-select mode state in notes list
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Rich text tool popover trays & screen anchor coordinates
  const [isHighlightTrayOpen, setIsHighlightTrayOpen] = useState(false);
  const [isTextColorTrayOpen, setIsTextColorTrayOpen] = useState(false);
  const [isSizeTrayOpen, setIsSizeTrayOpen] = useState(false);
  const [trayAnchor, setTrayAnchor] = useState<{ top: number; left: number } | null>(null);

  const closeAllTrays = useCallback(() => {
    setIsSizeTrayOpen(false);
    setIsHighlightTrayOpen(false);
    setIsTextColorTrayOpen(false);
    setTrayAnchor(null);
  }, []);

  const handleToggleSizeTray = (e: React.MouseEvent<HTMLButtonElement>) => {
    feedback.playClick();
    if (isSizeTrayOpen) {
      closeAllTrays();
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setTrayAnchor({
        top: rect.bottom + 6,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 160)),
      });
      setIsSizeTrayOpen(true);
      setIsHighlightTrayOpen(false);
      setIsTextColorTrayOpen(false);
    }
  };

  const handleToggleHighlightTray = (e: React.MouseEvent<HTMLButtonElement>) => {
    feedback.playClick();
    if (isHighlightTrayOpen) {
      closeAllTrays();
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setTrayAnchor({
        top: rect.bottom + 6,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 220)),
      });
      setIsHighlightTrayOpen(true);
      setIsSizeTrayOpen(false);
      setIsTextColorTrayOpen(false);
    }
  };

  const handleToggleTextColorTray = (e: React.MouseEvent<HTMLButtonElement>) => {
    feedback.playClick();
    if (isTextColorTrayOpen) {
      closeAllTrays();
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setTrayAnchor({
        top: rect.bottom + 6,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 250)),
      });
      setIsTextColorTrayOpen(true);
      setIsSizeTrayOpen(false);
      setIsHighlightTrayOpen(false);
    }
  };

  // Autosave status indicator: 'saved' | 'saving' | 'dirty'
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'dirty'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('Saved');

  // Refs for tracking unsaved dirty state, latest content buffers, and contentEditable DOM element
  const isDirtyRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const loadedNoteIdRef = useRef<string | null>(null);

  const activeNoteIdRef = useRef(activeNoteId);
  const editTitleRef = useRef(editTitle);
  const editContentRef = useRef(editContent);
  const editBackContentRef = useRef(editBackContent);
  const editIsTwoSidedRef = useRef(editIsTwoSided);
  const editIsPinnedRef = useRef(editIsPinned);
  const editCategoryRef = useRef(editCategory);
  const editColorRef = useRef(editColor);

  useEffect(() => { activeNoteIdRef.current = activeNoteId; }, [activeNoteId]);
  useEffect(() => { editTitleRef.current = editTitle; }, [editTitle]);
  useEffect(() => { editContentRef.current = editContent; }, [editContent]);
  useEffect(() => { editBackContentRef.current = editBackContent; }, [editBackContent]);
  useEffect(() => { editIsTwoSidedRef.current = editIsTwoSided; }, [editIsTwoSided]);
  useEffect(() => { editIsPinnedRef.current = editIsPinned; }, [editIsPinned]);
  useEffect(() => { editCategoryRef.current = editCategory; }, [editCategory]);
  useEffect(() => { editColorRef.current = editColor; }, [editColor]);

  // Presentation Mode state for flashcards
  const [presentingIndex, setPresentingIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Sync activeNoteId if it becomes invalid (e.g. deleted)
  useEffect(() => {
    if (activeNoteId && !scratchCards.some((c) => c.id === activeNoteId)) {
      if (scratchCards.length > 0) {
        setActiveNoteId(scratchCards[0].id);
      } else {
        setActiveNoteId(null);
        setIsMobileEditorOpen(false);
      }
    } else if (!activeNoteId && scratchCards.length > 0) {
      setActiveNoteId(scratchCards[0].id);
    }
  }, [scratchCards, activeNoteId]);

  // Find active note object
  const activeNote = useMemo(() => {
    return scratchCards.find((c) => c.id === activeNoteId) || null;
  }, [scratchCards, activeNoteId]);

  // Hydrate contentEditable DOM element reliably
  const hydrateEditorDom = useCallback((content: string) => {
    if (!editorRef.current) return;
    let html = content || '';
    if (html && !html.includes('<') && html.includes('\n')) {
      html = html
        .split('\n')
        .map((line) => `<p>${line || '<br>'}</p>`)
        .join('');
    }
    if (editorRef.current.innerHTML !== html) {
      editorRef.current.innerHTML = html;
    }
    editorRef.current.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      const el = input as HTMLInputElement;
      const isChecked = el.hasAttribute('checked');
      el.checked = isChecked;
      if (isChecked) {
        el.nextElementSibling?.classList.add('line-through', 'opacity-50');
      } else {
        el.nextElementSibling?.classList.remove('line-through', 'opacity-50');
      }
    });
  }, []);

  // Load active note into local editor state whenever activeNoteId changes
  useEffect(() => {
    if (activeNote && activeNote.id !== loadedNoteIdRef.current) {
      // If previous note had unsaved changes, flush immediately before switching
      if (isDirtyRef.current && loadedNoteIdRef.current) {
        const prevId = loadedNoteIdRef.current;
        updateScratchCard(prevId, {
          title: editTitleRef.current || 'Untitled Note',
          content: editContentRef.current,
          backContent: editBackContentRef.current,
          isTwoSided: editIsTwoSidedRef.current,
          isPinned: editIsPinnedRef.current,
          category: editCategoryRef.current,
          color: editColorRef.current,
        }, true).catch(console.error);
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
      }

      loadedNoteIdRef.current = activeNote.id;
      setEditTitle(activeNote.title);
      setEditContent(activeNote.content);
      editTitleRef.current = activeNote.title;
      editContentRef.current = activeNote.content;
      setEditBackContent(activeNote.backContent || '');
      editBackContentRef.current = activeNote.backContent || '';
      setEditIsTwoSided(Boolean(activeNote.isTwoSided));
      editIsTwoSidedRef.current = Boolean(activeNote.isTwoSided);
      setEditIsPinned(Boolean(activeNote.isPinned));
      editIsPinnedRef.current = Boolean(activeNote.isPinned);
      setEditCategory(activeNote.category || 'General');
      editCategoryRef.current = activeNote.category || 'General';
      setEditColor(activeNote.color || '#f26a36');
      editColorRef.current = activeNote.color || '#f26a36';

      hydrateEditorDom(activeNote.content || '');
      isDirtyRef.current = false;
      setSaveStatus('saved');
      setLastSavedTime(`Saved ${formatNoteDate(activeNote.updatedAt)}`);
    } else if (!activeNote && loadedNoteIdRef.current !== null) {
      loadedNoteIdRef.current = null;
      setEditTitle('');
      setEditContent('');
      editTitleRef.current = '';
      editContentRef.current = '';
      hydrateEditorDom('');
      setEditBackContent('');
      setEditIsTwoSided(false);
      setEditIsPinned(false);
      setEditCategory('General');
      setEditColor('#f26a36');
      isDirtyRef.current = false;
    }
  }, [activeNoteId, activeNote, hydrateEditorDom, updateScratchCard]);

  // Clean up any pending autosave debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Ensure DOM editor stays hydrated when opening mobile portal or fullscreen mode
  useEffect(() => {
    if (activeNote) {
      const timer = setTimeout(() => {
        hydrateEditorDom(editContentRef.current || activeNote.content || '');
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isMobileEditorOpen, isDesktopFullscreen, activeNote, hydrateEditorDom]);

  // Immediate flush save function (Guarantees zero data loss on blur, unmount, tab switch)
  const flushSaveNow = useCallback(async () => {
    const currentId = activeNoteIdRef.current;
    if (!currentId || !isDirtyRef.current) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    try {
      setSaveStatus('saving');
      const latestHtml = (editorRef.current && editorRef.current.isConnected)
        ? editorRef.current.innerHTML
        : (editContentRef.current || '');
      editContentRef.current = latestHtml;
      await updateScratchCard(
        currentId,
        {
          title: editTitleRef.current.trim() || 'Untitled Note',
          content: latestHtml,
          backContent: editIsTwoSidedRef.current ? editBackContentRef.current : '',
          isTwoSided: editIsTwoSidedRef.current,
          isPinned: editIsPinnedRef.current,
          category: editCategoryRef.current.trim() || 'General',
          color: editColorRef.current,
        },
        true // Silent update (no chime click on typing)
      );
      isDirtyRef.current = false;
      setSaveStatus('saved');
      const timeStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      setLastSavedTime(`Saved at ${timeStr}`);
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  }, [updateScratchCard]);

  // Schedule debounced autosave (250ms after user pauses typing)
  const triggerAutosave = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus('dirty');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      flushSaveNow();
    }, 250);
  }, [flushSaveNow]);

  // Handle contentEditable user typing / input
  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    editContentRef.current = html;
    setEditContent(html);
    triggerAutosave();
  };

  // Rich Text Execution Helpers
  const execCmd = (command: string, val: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    feedback.playClick();
    document.execCommand(command, false, val);
    handleEditorInput();
  };

  const handleApplySize = (tag: string) => {
    execCmd('formatBlock', tag);
    closeAllTrays();
  };

  const handleApplyHighlight = (colorHex: string) => {
    execCmd('hiliteColor', colorHex);
    closeAllTrays();
  };

  const handleApplyTextColor = (colorHex: string) => {
    execCmd('foreColor', colorHex);
    closeAllTrays();
  };

  // Interactive Checklist Checkbox Support
  const insertChecklist = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    feedback.playClick();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    const selectedText = range.toString().trim() || 'Checklist item';
    const checklistNode = document.createElement('div');
    checklistNode.className = 'note-checklist-row flex items-start gap-2.5 my-1.5 select-text';
    checklistNode.innerHTML = `<input type="checkbox" class="w-4 h-4 mt-1 rounded accent-[var(--accent-primary)] cursor-pointer shrink-0" /><span class="outline-none flex-1 leading-normal">${selectedText}</span>`;

    range.deleteContents();
    range.insertNode(checklistNode);

    const textSpan = checklistNode.querySelector('span');
    if (textSpan) {
      const newRange = document.createRange();
      newRange.selectNodeContents(textSpan);
      newRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }
    handleEditorInput();
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
      const input = target as HTMLInputElement;
      if (input.checked) {
        input.setAttribute('checked', 'checked');
        input.nextElementSibling?.classList.add('line-through', 'opacity-50');
      } else {
        input.removeAttribute('checked');
        input.nextElementSibling?.classList.remove('line-through', 'opacity-50');
      }
      feedback.playClick();
      handleEditorInput();
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const sel = window.getSelection();
      if (sel && sel.anchorNode) {
        const anchorEl = sel.anchorNode instanceof HTMLElement ? sel.anchorNode : sel.anchorNode.parentElement;
        const parentRow = anchorEl?.closest('.note-checklist-row');
        if (parentRow) {
          const textSpan = parentRow.querySelector('span');
          const text = textSpan?.textContent?.trim() || '';
          if (text === '') {
            // Exit checklist on empty item: convert to clean paragraph
            e.preventDefault();
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            parentRow.replaceWith(p);
            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
            handleEditorInput();
          } else {
            // Spawn next checklist row
            e.preventDefault();
            const nextRow = document.createElement('div');
            nextRow.className = 'note-checklist-row flex items-start gap-2.5 my-1.5 select-text';
            nextRow.innerHTML = `<input type="checkbox" class="w-4 h-4 mt-1 rounded accent-[var(--accent-primary)] cursor-pointer shrink-0" /><span class="outline-none flex-1 leading-normal"><br></span>`;
            parentRow.after(nextRow);
            const nextSpan = nextRow.querySelector('span');
            if (nextSpan) {
              const newRange = document.createRange();
              newRange.setStart(nextSpan, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
            handleEditorInput();
          }
        }
      }
    }
  };

  // Flush on window blur, visibility change (switching tabs/minimizing app), or beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSaveNow();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSaveNow();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('blur', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      flushSaveNow();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('blur', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushSaveNow]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    scratchCards.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ['all', ...Array.from(set)];
  }, [scratchCards]);

  // Filtered & Sorted notes (Pinned at top, then by most recently updated)
  const filteredNotes = useMemo(() => {
    const list = scratchCards.filter((c) => {
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = c.title.toLowerCase().includes(q);
        const matchContent = c.content.toLowerCase().includes(q);
        const matchBack = c.backContent?.toLowerCase().includes(q) ?? false;
        if (!matchTitle && !matchContent && !matchBack) return false;
      }
      return true;
    });

    // Pinned notes come first, then sort by updatedAt / createdAt descending
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = new Date(a.updatedAt || a.createdAt).getTime();
      const timeB = new Date(b.updatedAt || b.createdAt).getTime();
      return timeB - timeA;
    });
  }, [scratchCards, selectedCategory, searchQuery]);

  // Separate pinned vs standard notes for section headers
  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const unpinnedNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  // Handle Create New Note action (Instantly creates in Dexie and selects for typing)
  const handleCreateNewNote = async () => {
    feedback.playClick();
    await flushSaveNow();

    const newId = await addScratchCard({
      title: 'New Note',
      content: '',
      backContent: '',
      isTwoSided: false,
      isPinned: false,
      category: selectedCategory !== 'all' ? selectedCategory : 'General',
      color: '#f26a36',
    });

    setActiveNoteId(newId);
    setIsMobileEditorOpen(true);

    setTimeout(() => {
      const titleInput = document.getElementById('note-title-input');
      if (titleInput) {
        titleInput.focus();
      }
    }, 100);
  };

  // Handle selecting a note from the master list
  const handleSelectNote = async (noteId: string) => {
    if (noteId === activeNoteId) {
      setIsMobileEditorOpen(true);
      return;
    }
    feedback.playClick();
    await flushSaveNow();
    setActiveNoteId(noteId);
    setIsMobileEditorOpen(true);
  };

  // Single note deletion with confirmation (elevated z-index)
  const handleDeleteActiveNote = (noteToDelete: ScratchCard) => {
    const prompt = getRandomDeletePrompt('task', noteToDelete.title);
    requestDelete({
      title: prompt.title,
      message: prompt.message,
      confirmText: prompt.confirmText,
      cancelText: prompt.cancelText,
      onConfirm: async () => {
        isDirtyRef.current = false;
        await deleteScratchCard(noteToDelete.id);
        if (activeNoteId === noteToDelete.id) {
          const remaining = scratchCards.filter((c) => c.id !== noteToDelete.id);
          setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
          setIsMobileEditorOpen(false);
        }
      },
    });
  };

  // Multi-select card selection toggle
  const toggleSelectCard = (id: string) => {
    feedback.playClick();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Long press detection on note cards
  const startLongPress = (id: string) => {
    cancelLongPress();
    longPressTimerRef.current = setTimeout(() => {
      feedback.playClick();
      setIsSelectMode(true);
      setSelectedIds(new Set([id]));
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Batch delete selected notes
  const handleBatchDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;
    requestDelete({
      title: `Delete ${count} Note${count > 1 ? 's' : ''}?`,
      message: `Permanently delete ${count} note${count > 1 ? 's' : ''}? This action cannot be reversed.`,
      confirmText: `Delete ${count}`,
      cancelText: 'Cancel',
      onConfirm: async () => {
        isDirtyRef.current = false;
        const idsArray = Array.from(selectedIds);
        await bulkDeleteScratchCards(idsArray);
        const remaining = scratchCards.filter((c) => !selectedIds.has(c.id));
        setSelectedIds(new Set());
        setIsSelectMode(false);
        setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
        setIsMobileEditorOpen(false);
      },
    });
  };

  // Toggle Pinned status
  const handleTogglePin = async () => {
    feedback.playClick();
    const nextPin = !editIsPinned;
    setEditIsPinned(nextPin);
    if (activeNoteId) {
      await updateScratchCard(activeNoteId, { isPinned: nextPin }, true);
    }
  };

  // Note stats (derived from plain text without HTML tags)
  const plainText = useMemo(() => {
    if (!editContent) return '';
    return editContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }, [editContent]);

  const wordCount = useMemo(() => {
    if (!plainText) return 0;
    return plainText.split(/\s+/).length;
  }, [plainText]);

  const charCount = plainText.length;

  // Presentation Mode navigation
  const activePresentedCard =
    presentingIndex !== null && filteredNotes[presentingIndex]
      ? filteredNotes[presentingIndex]
      : null;

  const handleNextCard = () => {
    if (presentingIndex === null) return;
    feedback.playClick();
    setIsFlipped(false);
    setPresentingIndex((prev) => (prev! + 1 < filteredNotes.length ? prev! + 1 : 0));
  };

  const handlePrevCard = () => {
    if (presentingIndex === null) return;
    feedback.playClick();
    setIsFlipped(false);
    setPresentingIndex((prev) => (prev! - 1 >= 0 ? prev! - 1 : filteredNotes.length - 1));
  };

  const handleFlip = () => {
    feedback.playClick();
    setIsFlipped((prev) => !prev);
  };

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (presentingIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextCard();
      if (e.key === 'ArrowLeft') handlePrevCard();
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleFlip();
      }
      if (e.key === 'Escape') setPresentingIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [presentingIndex, filteredNotes.length]);

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // =========================================================================
  // RENDER EDITOR COMPONENT: Full-Screen on Mobile, Inline Right Pane on Desktop
  // =========================================================================
  const renderEditor = (isMobileMode: boolean) => {
    if (!activeNote) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
          <FileText className="w-12 h-12 stroke-[1.2] text-zinc-600 mb-3" />
          <h3 className="font-display text-base font-bold text-zinc-300">No Note Selected</h3>
          <p className="text-xs text-zinc-500 max-w-xs mt-1">
            Choose a note from the sidebar or create a new note to start writing.
          </p>
          <button
            type="button"
            onClick={handleCreateNewNote}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs bg-white/10 hover:bg-white/15 text-white pressable cursor-pointer transition-all border border-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Note</span>
          </button>
        </div>
      );
    }

    return (
      <div className={`flex-1 flex flex-col h-full overflow-hidden ${
        paperTheme === 'light'
          ? 'notepad-paper-light bg-[#fcfbf9] text-zinc-900'
          : isMobileMode
          ? 'bg-black text-white'
          : 'bg-transparent text-white'
      }`}>
        {/* Editor Top Bar: Back (Mobile), Autosave Pill, Tools */}
        <div
          className={`px-3 sm:px-4 py-2.5 flex items-center justify-between border-b gap-2 shrink-0 select-none min-w-0 ${
            paperTheme === 'light'
              ? 'bg-[#f4f3f0] border-zinc-300/80 text-zinc-900'
              : 'bg-black/40 border-white/8 text-white'
          }`}
          style={{
            paddingTop: isMobileMode ? 'max(var(--sat, 0px), 12px)' : undefined,
          }}
        >
          {/* Left: Mobile Back Button + Save Status */}
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            {isMobileMode && (
              <button
                type="button"
                onClick={() => {
                  feedback.playClick();
                  flushSaveNow();
                  setIsMobileEditorOpen(false);
                }}
                className={`flex items-center gap-1 text-xs font-bold pressable py-1 px-2.5 rounded-xl cursor-pointer shrink-0 ${
                  paperTheme === 'light'
                    ? 'text-zinc-800 bg-zinc-200/90 hover:bg-zinc-300'
                    : 'text-[var(--accent-primary)] hover:text-white bg-white/6'
                }`}
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Notes</span>
              </button>
            )}

            {/* Autosave Status Pill: Responsive, takes as much space as it needs */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono min-w-0 max-w-full shrink transition-all ${
              paperTheme === 'light'
                ? 'bg-zinc-200/80 border-zinc-300 text-zinc-700'
                : 'bg-white/5 border-white/8 text-zinc-300'
            }`}>
              {saveStatus === 'saving' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <span className="text-amber-500 font-semibold truncate whitespace-nowrap">Saving...</span>
                </>
              ) : saveStatus === 'dirty' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                  <span className="text-zinc-400 truncate whitespace-nowrap">Unsaved</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-emerald-500 stroke-[2.5] shrink-0" />
                  <span className={`truncate whitespace-nowrap ${paperTheme === 'light' ? 'text-zinc-700 font-medium' : 'text-zinc-300 font-medium'}`}>
                    {lastSavedTime}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Right: Note Tools (Theme Toggle, Fullscreen, Pin, Study Mode, Delete) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Notepad Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={togglePaperTheme}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer pressable ${
                paperTheme === 'light'
                  ? 'bg-amber-100/90 text-amber-900 border-amber-300 shadow-sm hover:bg-amber-200/90'
                  : 'border-white/8 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
              title={paperTheme === 'light' ? 'Switch to Dark Notepad' : 'Switch to Light Notepad'}
            >
              {paperTheme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Desktop / Laptop Zen Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => {
                feedback.playClick();
                setIsDesktopFullscreen((p) => !p);
              }}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer pressable hidden sm:flex items-center justify-center ${
                isDesktopFullscreen
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/40 shadow-sm'
                  : paperTheme === 'light'
                  ? 'border-zinc-300/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  : 'border-white/8 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
              title={isDesktopFullscreen ? 'Exit Full Screen (Esc)' : 'Zen Full Screen (Hide everything)'}
            >
              {isDesktopFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* Pin Toggle */}
            <button
              type="button"
              onClick={handleTogglePin}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer pressable ${
                editIsPinned
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : paperTheme === 'light'
                  ? 'border-zinc-300/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  : 'border-white/8 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
              title={editIsPinned ? 'Unpin Note' : 'Pin Note to Top'}
            >
              <Pin className={`w-3.5 h-3.5 ${editIsPinned ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Hybrid Study / Flashcard Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                feedback.playClick();
                setEditIsTwoSided((prev) => !prev);
                triggerAutosave();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-colors cursor-pointer pressable ${
                editIsTwoSided
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/40'
                  : paperTheme === 'light'
                  ? 'border-zinc-300/80 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                  : 'border-white/8 text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
              title="Toggle Study / Flashcard flip side"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Study Mode</span>
            </button>

            {/* Delete Note (Elevated confirmation modal) */}
            <button
              type="button"
              onClick={() => handleDeleteActiveNote(activeNote)}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer pressable ${
                paperTheme === 'light'
                  ? 'border-zinc-300/80 text-zinc-600 hover:text-rose-600 hover:bg-rose-100'
                  : 'border-white/8 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10'
              }`}
              title="Delete Note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Native Notepad Formatting & Rich Text Toolbar */}
        <div className={`px-3 sm:px-4 py-2 flex items-center gap-1.5 border-b overflow-x-auto no-scrollbar shrink-0 scroll-smooth relative z-20 ${
          paperTheme === 'light'
            ? 'bg-[#f4f3f0] border-zinc-300/80 text-zinc-900'
            : 'bg-zinc-950/80 border-white/8 text-white'
        }`}>
          {/* Undo / Redo */}
          <div className={`flex items-center gap-0.5 shrink-0 rounded-xl p-0.5 border ${
            paperTheme === 'light' ? 'bg-zinc-200/80 border-zinc-300/80' : 'bg-white/5 border-white/6'
          }`}>
            <button
              type="button"
              onClick={() => execCmd('undo')}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('redo')}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-4 shrink-0 mx-0.5 ${paperTheme === 'light' ? 'bg-zinc-300' : 'bg-white/10'}`} />

          {/* Text Size / Hierarchy Selector Pill */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={handleToggleSizeTray}
              className={`h-7 px-2 rounded-lg border text-xs font-semibold flex items-center gap-1 pressable cursor-pointer transition-colors ${
                paperTheme === 'light'
                  ? 'bg-zinc-200/80 border-zinc-300/80 text-zinc-800 hover:text-zinc-950 hover:bg-zinc-300/70'
                  : 'bg-white/5 border-white/8 text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Text Size & Hierarchy"
            >
              <span>Size</span>
              <span className={`text-[10px] ${paperTheme === 'light' ? 'text-zinc-600' : 'text-zinc-500'}`}>▼</span>
            </button>
          </div>

          <div className={`w-[1px] h-4 shrink-0 mx-0.5 ${paperTheme === 'light' ? 'bg-zinc-300' : 'bg-white/10'}`} />

          {/* Core Text Styling (Bold, Italic, Underline, Strikethrough) */}
          <div className={`flex items-center gap-0.5 shrink-0 rounded-xl p-0.5 border ${
            paperTheme === 'light' ? 'bg-zinc-200/80 border-zinc-300/80' : 'bg-white/5 border-white/6'
          }`}>
            <button
              type="button"
              onClick={() => execCmd('bold')}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center font-bold text-xs ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('italic')}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('underline')}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('strikeThrough')}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-4 shrink-0 mx-0.5 ${paperTheme === 'light' ? 'bg-zinc-300' : 'bg-white/10'}`} />

          {/* Text Highlighter Marker with Palette */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={handleToggleHighlightTray}
              className={`h-7 px-2 rounded-lg border text-xs font-semibold flex items-center gap-1 pressable cursor-pointer transition-colors ${
                paperTheme === 'light'
                  ? 'bg-zinc-200/80 border-zinc-300/80 text-amber-800 hover:bg-zinc-300/70'
                  : 'bg-white/5 border-white/8 text-amber-300 hover:bg-white/10'
              }`}
              title="Highlighter Marker"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Highlight</span>
            </button>
          </div>

          {/* Text Color Picker with Palette */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={handleToggleTextColorTray}
              className={`h-7 px-2 rounded-lg border text-xs font-semibold flex items-center gap-1 pressable cursor-pointer transition-colors ${
                paperTheme === 'light'
                  ? 'bg-zinc-200/80 border-zinc-300/80 text-zinc-800 hover:text-zinc-950 hover:bg-zinc-300/70'
                  : 'bg-white/5 border-white/8 text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Text Color"
            >
              <Type className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden sm:inline">Color</span>
            </button>
          </div>

          <div className={`w-[1px] h-4 shrink-0 mx-0.5 ${paperTheme === 'light' ? 'bg-zinc-300' : 'bg-white/10'}`} />

          {/* List & Structure Tools */}
          <div className={`flex items-center gap-0.5 shrink-0 rounded-xl p-0.5 border ${
            paperTheme === 'light' ? 'bg-zinc-200/80 border-zinc-300/80' : 'bg-white/5 border-white/6'
          }`}>
            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Bullet List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={insertChecklist}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Checklist (Interactive Checkboxes)"
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('formatBlock', 'blockquote')}
              className={`w-7 h-7 rounded-lg pressable cursor-pointer flex items-center justify-center ${
                paperTheme === 'light' ? 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/70' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Quote"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`w-[1px] h-4 shrink-0 mx-0.5 ${paperTheme === 'light' ? 'bg-zinc-300' : 'bg-white/10'}`} />

          {/* Folder Tag */}
          <div className={`flex items-center gap-1 shrink-0 border rounded-xl px-2 py-0.5 ${
            paperTheme === 'light' ? 'bg-zinc-200/80 border-zinc-300/80 text-zinc-700' : 'bg-white/5 border-white/8 text-zinc-300'
          }`}>
            <span className={`text-[10px] font-mono uppercase ${paperTheme === 'light' ? 'text-zinc-600 font-semibold' : 'text-zinc-500'}`}>Folder:</span>
            <input
              type="text"
              value={editCategory}
              onChange={(e) => {
                setEditCategory(e.target.value);
                triggerAutosave();
              }}
              onBlur={flushSaveNow}
              placeholder="General"
              className={`px-1.5 py-0.5 bg-transparent text-[11px] focus:outline-none w-20 text-center font-medium ${
                paperTheme === 'light' ? 'text-zinc-900 placeholder-zinc-400' : 'text-zinc-200 placeholder-zinc-500'
              }`}
            />
          </div>

          {/* Note Swatch Colors */}
          <div className="flex items-center gap-1 shrink-0 pr-2">
            {NOTE_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  setEditColor(c.value);
                  triggerAutosave();
                }}
                className={`w-3.5 h-3.5 rounded-full transition-transform cursor-pointer ${
                  editColor === c.value
                    ? paperTheme === 'light'
                      ? 'scale-125 ring-2 ring-zinc-700 shadow-sm'
                      : 'scale-125 ring-2 ring-white/50'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.value }}
                title={`Note color: ${c.label}`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable Document Canvas (Title + Body + Study Deck) */}
        <div
          className={`flex-1 overflow-y-auto px-6 sm:px-10 py-6 sm:py-8 flex flex-col gap-4 ${
            paperTheme === 'light' ? 'bg-[#fcfbf9]' : ''
          }`}
          onClick={closeAllTrays}
        >
          {/* Note Title Input */}
          <input
            id="note-title-input"
            type="text"
            placeholder="Title"
            value={editTitle}
            onChange={(e) => {
              setEditTitle(e.target.value);
              triggerAutosave();
            }}
            onBlur={flushSaveNow}
            className={`w-full bg-transparent font-display font-black text-2xl sm:text-3xl tracking-tight focus:outline-none border-none p-0 ${
              paperTheme === 'light' ? 'text-zinc-900 placeholder-zinc-400' : 'text-white placeholder-zinc-600'
            }`}
          />

          {/* Native WYSIWYG Notepad Content Area */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleEditorInput}
            onClick={handleEditorClick}
            onKeyDown={handleEditorKeyDown}
            onBlur={flushSaveNow}
            data-placeholder="Start typing your note... Notes autosave continuously as you write."
            className={`w-full flex-1 bg-transparent text-base sm:text-lg leading-relaxed font-body focus:outline-none min-h-[260px] pb-24 rich-note-editor ${
              paperTheme === 'light' ? 'text-zinc-900 placeholder-zinc-400' : 'text-zinc-100 placeholder-zinc-500'
            }`}
            style={{
              caretColor: 'var(--accent-primary)',
              wordBreak: 'break-word',
            }}
          />

          {/* Hybrid Study / Flashcard Flip Side Drawer */}
          {editIsTwoSided && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-2xl p-4 border flex flex-col gap-2 mt-4 ${
                paperTheme === 'light'
                  ? 'border-zinc-300 bg-zinc-100/90 text-zinc-900 shadow-sm'
                  : 'border-white/10 bg-white/[0.03] text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-amber-500" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    paperTheme === 'light' ? 'text-zinc-900' : 'text-white'
                  }`}>
                    Flashcard Flip Side (Answer / Back of Card)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    flushSaveNow();
                    const idx = filteredNotes.findIndex((n) => n.id === activeNoteId);
                    setPresentingIndex(idx >= 0 ? idx : 0);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--accent-primary)] text-white shadow-md pressable cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Present Deck</span>
                </button>
              </div>

              <textarea
                rows={3}
                placeholder="Write the back of the card or test answer here..."
                value={editBackContent}
                onChange={(e) => {
                  setEditBackContent(e.target.value);
                  triggerAutosave();
                }}
                onBlur={flushSaveNow}
                className={`w-full p-3 rounded-xl text-xs focus:outline-none resize-none ${
                  paperTheme === 'light'
                    ? 'bg-white border border-zinc-300 text-zinc-900 placeholder-zinc-400'
                    : 'solid-input text-white placeholder-zinc-500'
                }`}
              />
            </motion.div>
          )}
        </div>

        {/* Editor Footer: Word Count, Stats & Last Saved Info */}
        <div
          className={`px-5 py-2.5 border-t flex items-center justify-between text-[11px] font-mono shrink-0 ${
            paperTheme === 'light'
              ? 'bg-[#f4f3f0] border-zinc-300/80 text-zinc-700'
              : 'bg-black/40 border-white/8 text-zinc-500'
          }`}
          style={{
            paddingBottom: isMobileMode ? 'max(var(--sab, 0px), 12px)' : undefined,
          }}
        >
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} characters</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>{formatNoteDate(activeNote.updatedAt || activeNote.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] max-w-7xl mx-auto w-full select-none relative z-10 pb-28 sm:pb-24 md:pb-12 gap-3 sm:gap-4">
      {/* 1. Standardized Section Header */}
      <SectionHeader
        title="Notes"
        subtitle={`${scratchCards.length} ${scratchCards.length === 1 ? 'note' : 'notes'}`}
        actions={
          <div className="flex items-center gap-2">
            {scratchCards.some((c) => c.isTwoSided) && (
              <button
                type="button"
                onClick={() => setPresentingIndex(0)}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-full font-bold text-xs bg-white/10 hover:bg-white/15 text-white pressable transition-all border border-white/10 cursor-pointer shadow-sm"
                title="Study Flashcards Deck"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Study Deck</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCreateNewNote}
              className="flex items-center gap-1.5 h-9 px-3.5 rounded-full font-bold text-xs pressable shadow-sm transition-all cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
              }}
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">New Note</span>
            </button>
          </div>
        }
      />

      {/* ========================================================
          NOTEPAD SPLIT / MASTER-DETAIL CONTAINER
          ======================================================== */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
        {/* ========================================================
            LEFT PANE: NOTES MASTER LIST & SIDEBAR
            (Hidden on mobile when editor drill-down is open)
            ======================================================== */}
        <div
          className={`w-full md:w-80 lg:w-96 flex flex-col border-b md:border-b-0 md:border-r border-white/10 transition-all duration-300 ${
            isMobileEditorOpen ? 'hidden md:flex' : 'flex'
          }`}
          style={{ backgroundColor: 'var(--bg-canvas)' }}
        >
          {/* Sidebar Header: Title, Note Count, Select & New Note Buttons */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/8 gap-2">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-white">
                Notes
              </h1>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-white/8 text-zinc-400">
                {scratchCards.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {scratchCards.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    setIsSelectMode((p) => !p);
                    setSelectedIds(new Set());
                  }}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    isSelectMode
                      ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isSelectMode ? 'Done' : 'Select'}
                </button>
              )}

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleCreateNewNote}
                className="flex items-center gap-1.5 h-8 px-3 rounded-full font-bold text-xs pressable shadow-md transition-all cursor-pointer text-white"
                style={{ backgroundColor: 'var(--accent-primary)' }}
                title="Create new note"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New</span>
              </motion.button>
            </div>
          </div>

          {/* Search Input */}
          <div className="p-3 border-b border-white/6">
            <div className="relative w-full h-9">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search all notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full pl-9 pr-3 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Filter Pills (Fluid Spring Sliding Capsule) */}
          <div className="px-3 py-2 border-b border-white/6 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    feedback.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors relative cursor-pointer ${
                    isSelected ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="notesActiveCategoryPill"
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: 'var(--accent-primary)' }}
                      transition={FLUID_SPRINGS.snappy}
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Master List of Notes (With Generous Bottom Space) */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-1 pb-24">
            {filteredNotes.length === 0 ? (
              <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
                <FileText className="w-8 h-8 stroke-[1.5] text-zinc-600 mb-2" />
                <span className="font-display text-xs font-semibold text-zinc-400">
                  {searchQuery ? 'No matching notes' : 'No notes yet'}
                </span>
                <p className="text-[11px] text-zinc-600 mt-1">Tap "+ New" to start writing.</p>
              </div>
            ) : (
              <>
                {/* Pinned Notes Section */}
                {pinnedNotes.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-400">
                      <Pin className="w-2.5 h-2.5 fill-zinc-400" />
                      <span>Pinned</span>
                    </div>
                    {pinnedNotes.map((note) => {
                      const isSelected = activeNoteId === note.id;
                      const isChecked = selectedIds.has(note.id);
                      const snippet = (note.content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || 'No additional text';

                      return (
                        <div
                          key={note.id}
                          onPointerDown={() => startLongPress(note.id)}
                          onPointerUp={cancelLongPress}
                          onPointerLeave={cancelLongPress}
                          onClick={() => {
                            if (isSelectMode) {
                              toggleSelectCard(note.id);
                            } else {
                              handleSelectNote(note.id);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer pressable mb-1 group relative flex items-center gap-3 ${
                            isSelectMode && isChecked
                              ? 'bg-white/14 border-white/25 text-white shadow-sm'
                              : isSelected && !isSelectMode
                              ? 'bg-white/12 text-white shadow-sm border border-white/15'
                              : 'hover:bg-white/[0.05] text-zinc-300 border border-transparent'
                          }`}
                        >
                          {/* Multi-Select iOS Checkbox Circle */}
                          {isSelectMode && (
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                isChecked
                                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-sm'
                                  : 'border-white/30 bg-white/5'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-display text-xs font-bold truncate text-white">
                                {note.title || 'Untitled Note'}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: note.color || 'var(--accent-primary)' }}
                                />
                                <Pin className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              </div>
                            </div>

                            <p className="text-[11px] text-zinc-400 truncate line-clamp-1 leading-relaxed">
                              {snippet}
                            </p>

                            <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500 font-mono">
                              <span>{formatNoteDate(note.updatedAt || note.createdAt)}</span>
                              <span className="px-1.5 py-0.2 rounded bg-white/6 text-zinc-400 uppercase text-[9px]">
                                {note.category || 'General'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Regular Notes Section */}
                {unpinnedNotes.length > 0 && (
                  <div>
                    {pinnedNotes.length > 0 && (
                      <div className="px-3 py-1 text-[10px] font-mono font-bold tracking-wider uppercase text-zinc-500">
                        Notes
                      </div>
                    )}
                    {unpinnedNotes.map((note) => {
                      const isSelected = activeNoteId === note.id;
                      const isChecked = selectedIds.has(note.id);
                      const snippet = (note.content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || 'No additional text';

                      return (
                        <div
                          key={note.id}
                          onPointerDown={() => startLongPress(note.id)}
                          onPointerUp={cancelLongPress}
                          onPointerLeave={cancelLongPress}
                          onClick={() => {
                            if (isSelectMode) {
                              toggleSelectCard(note.id);
                            } else {
                              handleSelectNote(note.id);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer pressable mb-1 group relative flex items-center gap-3 ${
                            isSelectMode && isChecked
                              ? 'bg-white/14 border-white/25 text-white shadow-sm'
                              : isSelected && !isSelectMode
                              ? 'bg-white/12 text-white shadow-sm border border-white/15'
                              : 'hover:bg-white/[0.05] text-zinc-300 border border-transparent'
                          }`}
                        >
                          {/* Multi-Select iOS Checkbox Circle */}
                          {isSelectMode && (
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                isChecked
                                  ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white shadow-sm'
                                  : 'border-white/30 bg-white/5'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-display text-xs font-bold truncate text-white">
                                {note.title || 'Untitled Note'}
                              </span>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: note.color || 'var(--accent-primary)' }}
                                />
                                {note.isTwoSided && (
                                  <span title="Study Card">
                                    <RotateCw className="w-2.5 h-2.5 text-zinc-500" />
                                  </span>
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] text-zinc-400 truncate line-clamp-1 leading-relaxed">
                              {snippet}
                            </p>

                            <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500 font-mono">
                              <span>{formatNoteDate(note.updatedAt || note.createdAt)}</span>
                              <span className="px-1.5 py-0.2 rounded bg-white/6 text-zinc-400 uppercase text-[9px]">
                                {note.category || 'General'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Multi-Select Desktop Docked Batch Action Bar (In Sidebar Footer) */}
          {!isMobile && isSelectMode && (
            <div className="border-t border-white/8 bg-zinc-900/90 p-3 flex items-center justify-between gap-2 shrink-0 select-none">
              <button
                type="button"
                onClick={() => {
                  feedback.playClick();
                  if (selectedIds.size === filteredNotes.length) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(filteredNotes.map((n) => n.id)));
                  }
                }}
                className="text-xs text-zinc-300 hover:text-white font-medium px-2 py-1 cursor-pointer"
              >
                {selectedIds.size === filteredNotes.length ? 'Deselect All' : 'Select All'}
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-mono">
                  {selectedIds.size} selected
                </span>

                <button
                  type="button"
                  disabled={selectedIds.size === 0}
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed pressable cursor-pointer shadow-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedIds.size})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            RIGHT PANE: NOTEPAD EDITOR CANVAS (DESKTOP)
            ======================================================== */}
        {!isMobile && !isDesktopFullscreen && (
          <div className={`hidden md:flex md:flex-1 md:flex-col md:overflow-hidden md:relative ${
            paperTheme === 'light' ? 'md:bg-[#fcfbf9]' : 'md:bg-zinc-950/60'
          }`}>
            {renderEditor(false)}
          </div>
        )}
      </div>

      {/* ========================================================
          FULL-SCREEN DESKTOP NOTEPAD (PORTAL TO BODY)
          Completely covers screen, navbar & sidebars on PC/Laptop
          ======================================================== */}
      {isDesktopFullscreen && typeof document !== 'undefined' &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={FLUID_SPRINGS.modal}
            className={`fixed inset-0 z-[120] w-screen h-screen overflow-hidden flex flex-col ${
              paperTheme === 'light' ? 'bg-[#fcfbf9] text-zinc-900' : 'bg-zinc-950 text-white'
            }`}
          >
            {renderEditor(false)}
          </motion.div>,
          document.body
        )}

      {/* ========================================================
          FULL-SCREEN MOBILE NOTE EDITOR (PORTAL TO BODY)
          Completely covers entire screen, top navbar & bottom tab bar
          ======================================================== */}
      {isMobile && isMobileEditorOpen && typeof document !== 'undefined' &&
        createPortal(
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={FLUID_SPRINGS.sheet}
            className="fixed inset-0 z-[100] w-screen h-screen bg-black overflow-hidden flex flex-col"
          >
            {renderEditor(true)}
          </motion.div>,
          document.body
        )}

      {/* ========================================================
          FOCUSED FLASHCARD PRESENTATION MODE (PORTAL TO BODY)
          ======================================================== */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {activePresentedCard && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 select-none modal-backdrop">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPresentingIndex(null)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md"
                  style={{ willChange: 'opacity' }}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={FLUID_SPRINGS.modal}
                  className="relative z-10 w-full max-w-lg aspect-[4/3] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl border border-white/20"
                  style={{
                    backgroundColor: activePresentedCard.color || '#f26a36',
                    color: '#ffffff',
                    willChange: 'transform, opacity',
                  }}
                >
                  {/* Top Bar: Counter & Close */}
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-white/80">
                    <span>
                      CARD {presentingIndex! + 1} OF {filteredNotes.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPresentingIndex(null)}
                      className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white pressable transition-all cursor-pointer"
                      title="Exit Deck (Esc)"
                    >
                      <X className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Card Center: Front vs Back Flip Side */}
                  <div className="flex-1 flex flex-col items-center justify-center text-center px-4 my-auto select-text">
                    <motion.div
                      key={isFlipped ? 'back' : 'front'}
                      initial={{ opacity: 0, rotateX: 90 }}
                      animate={{ opacity: 1, rotateX: 0 }}
                      exit={{ opacity: 0, rotateX: -90 }}
                      transition={{ duration: 0.25 }}
                      className="w-full flex flex-col items-center justify-center"
                    >
                      <span className="text-[10px] font-mono tracking-widest uppercase mb-2 px-2.5 py-0.5 rounded-full bg-black/20 text-white/90">
                        {isFlipped ? 'Answer / Flip Side' : 'Question / Front'}
                      </span>

                      <h2 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight mb-2">
                        {isFlipped
                          ? activePresentedCard.backContent || 'No back answer specified'
                          : activePresentedCard.title}
                      </h2>

                      {!isFlipped && (
                        <p className="text-sm sm:text-base text-white/90 max-w-md line-clamp-4 leading-relaxed font-body">
                          {(activePresentedCard.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}
                        </p>
                      )}
                    </motion.div>
                  </div>

                  {/* Bottom Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/20">
                    <button
                      type="button"
                      onClick={handlePrevCard}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold solid-input text-zinc-300 hover:text-white pressable cursor-pointer"
                      title="Previous Card (←)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    {activePresentedCard.isTwoSided ? (
                      <button
                        type="button"
                        onClick={handleFlip}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold pressable transition-all cursor-pointer shadow-md"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          color: '#ffffff',
                        }}
                        title="Flip Card (Space)"
                      >
                        <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Flip Card</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-zinc-500">
                        Use ← and → to navigate
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={handleNextCard}
                      className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold solid-input text-zinc-300 hover:text-white pressable cursor-pointer"
                      title="Next Card (→)"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

      {/* ========================================================
          MOBILE FLOATING MULTI-SELECT BAR (PORTAL TO BODY)
          Docks flush to the bottom of mobile viewport over dock,
          never blocks note cards in the middle of screen!
          ======================================================== */}
      {isMobile && isSelectMode && typeof document !== 'undefined' &&
        createPortal(
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={FLUID_SPRINGS.sheet}
            className="fixed bottom-0 left-0 right-0 z-[120] px-4 py-3 pb-[max(var(--sab,0px),16px)] bg-zinc-900/95 backdrop-blur-2xl border-t border-white/12 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 select-none"
          >
            <button
              type="button"
              onClick={() => {
                feedback.playClick();
                if (selectedIds.size === filteredNotes.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(filteredNotes.map((n) => n.id)));
                }
              }}
              className="text-xs text-zinc-300 hover:text-white font-medium px-2 py-1.5 cursor-pointer"
            >
              {selectedIds.size === filteredNotes.length ? 'Deselect All' : 'Select All'}
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 font-mono">
                {selectedIds.size} selected
              </span>

              <button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs hover:bg-rose-500 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed pressable cursor-pointer shadow-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete ({selectedIds.size})</span>
              </button>
            </div>
          </motion.div>,
          document.body
        )}

      {/* ========================================================
          FLOATING TOOLBAR DROPDOWNS (PORTALS TO BODY)
          Render on upper z-index above note writing screen,
          never trapped or clipped by toolbar overflow!
          ======================================================== */}
      {/* 1. Size / Hierarchy Tray */}
      {isSizeTrayOpen && trayAnchor && typeof document !== 'undefined' &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[99998]" onClick={closeAllTrays} />
            <div
              style={{ top: `${trayAnchor.top}px`, left: `${trayAnchor.left}px` }}
              className={`fixed z-[99999] rounded-xl border shadow-2xl p-1.5 flex flex-col gap-0.5 min-w-[130px] backdrop-blur-2xl animate-in fade-in duration-150 ${
                paperTheme === 'light'
                  ? 'bg-white/95 border-zinc-300 text-zinc-900 shadow-[0_12px_32px_rgba(0,0,0,0.18)]'
                  : 'bg-zinc-900/95 border-white/15 text-white shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
              }`}
            >
              {FONT_HIERARCHIES.map((h) => (
                <button
                  key={h.tag}
                  type="button"
                  onClick={() => handleApplySize(h.tag)}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between cursor-pointer transition-colors ${
                    paperTheme === 'light'
                      ? 'text-zinc-800 hover:bg-zinc-100 hover:text-zinc-950'
                      : 'text-zinc-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span className="font-semibold">{h.label}</span>
                  <span className={`text-[10px] font-mono ${paperTheme === 'light' ? 'text-zinc-400 font-semibold' : 'text-zinc-500'}`}>
                    {h.tag.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </>,
          document.body
        )}

      {/* 2. Highlight Color Tray */}
      {isHighlightTrayOpen && trayAnchor && typeof document !== 'undefined' &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[99998]" onClick={closeAllTrays} />
            <div
              style={{ top: `${trayAnchor.top}px`, left: `${trayAnchor.left}px` }}
              className={`fixed z-[99999] rounded-xl border shadow-2xl p-2 flex items-center gap-1.5 backdrop-blur-2xl animate-in fade-in duration-150 ${
                paperTheme === 'light'
                  ? 'bg-white/95 border-zinc-300 shadow-[0_12px_32px_rgba(0,0,0,0.18)]'
                  : 'bg-zinc-900/95 border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
              }`}
            >
              {HIGHLIGHT_COLORS.map((hc) => (
                <button
                  key={hc.label}
                  type="button"
                  onClick={() => handleApplyHighlight(hc.color)}
                  className="w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-125 cursor-pointer flex items-center justify-center text-[10px]"
                  style={{ backgroundColor: hc.color }}
                  title={hc.label}
                >
                  {hc.color === 'transparent' && '✕'}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}

      {/* 3. Text Color Tray */}
      {isTextColorTrayOpen && trayAnchor && typeof document !== 'undefined' &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[99998]" onClick={closeAllTrays} />
            <div
              style={{ top: `${trayAnchor.top}px`, left: `${trayAnchor.left}px` }}
              className={`fixed z-[99999] rounded-xl border shadow-2xl p-2 flex items-center gap-1.5 backdrop-blur-2xl animate-in fade-in duration-150 ${
                paperTheme === 'light'
                  ? 'bg-white/95 border-zinc-300 shadow-[0_12px_32px_rgba(0,0,0,0.18)]'
                  : 'bg-zinc-900/95 border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.6)]'
              }`}
            >
              {TEXT_COLORS.map((tc) => (
                <button
                  key={tc.label}
                  type="button"
                  onClick={() => handleApplyTextColor(tc.color)}
                  className="w-5 h-5 rounded-full border border-zinc-500/40 ring-1 ring-black/10 transition-transform hover:scale-125 cursor-pointer shadow-sm"
                  style={{ backgroundColor: tc.color }}
                  title={tc.label}
                />
              ))}
            </div>
          </>,
          document.body
        )}
    </div>
  );
};
