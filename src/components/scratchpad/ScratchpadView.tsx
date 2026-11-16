import React, { useState, useMemo, useEffect, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { APPLE_SPRINGS } from '../../utils/motion';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Play,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  X,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ScratchCard } from '../../types';
import { feedback } from '../../utils/feedback';
import { getRandomDeletePrompt } from '../../utils/genz';

const CARD_COLORS = [
  { label: 'Terracotta', value: '#f26a36' },
  { label: 'Sky Blue', value: '#38bdf8' },
  { label: 'Matcha', value: '#84cc16' },
  { label: 'Lilac', value: '#c084fc' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Rose', value: '#f472b6' },
  { label: 'Slate', value: '#94a3b8' },
];

export const ScratchpadView: React.FC = () => {
  const { scratchCards, addScratchCard, updateScratchCard, deleteScratchCard, requestDelete } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Presentation Mode state
  const [presentingIndex, setPresentingIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Card Creator / Editor Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<ScratchCard | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [isTwoSided, setIsTwoSided] = useState(false);
  const [category, setCategory] = useState('General');
  const [color, setColor] = useState('#f26a36');

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    scratchCards.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ['all', ...Array.from(set)];
  }, [scratchCards]);

  // Filtered cards list
  const filteredCards = useMemo(() => {
    return scratchCards.filter((c) => {
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
  }, [scratchCards, selectedCategory, searchQuery]);

  // Handle open editor
  const handleOpenCreate = () => {
    feedback.playClick();
    setEditingCard(null);
    setTitle('');
    setContent('');
    setBackContent('');
    setIsTwoSided(false);
    setCategory('General');
    setColor('#f26a36');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (card: ScratchCard) => {
    feedback.playClick();
    setEditingCard(card);
    setTitle(card.title);
    setContent(card.content);
    setBackContent(card.backContent || '');
    setIsTwoSided(Boolean(card.isTwoSided));
    setCategory(card.category || 'General');
    setColor(card.color || '#f26a36');
    setIsModalOpen(true);
  };

  const handleSaveCard = async () => {
    if (!title.trim() && !content.trim()) return;
    feedback.playClick();
    if (editingCard) {
      await updateScratchCard(editingCard.id, {
        title: title.trim() || 'Untitled Card',
        content: content.trim(),
        backContent: isTwoSided ? backContent.trim() : '',
        isTwoSided,
        category: category.trim() || 'General',
        color,
      });
    } else {
      await addScratchCard({
        title: title.trim() || 'Untitled Card',
        content: content.trim(),
        backContent: isTwoSided ? backContent.trim() : '',
        isTwoSided,
        category: category.trim() || 'General',
        color,
      });
    }
    setIsModalOpen(false);
  };

  const handleDeleteCard = (card: ScratchCard) => {
    const prompt = getRandomDeletePrompt('task', card.title);
    requestDelete({
      title: prompt.title,
      message: prompt.message,
      confirmText: prompt.confirmText,
      cancelText: prompt.cancelText,
      onConfirm: async () => {
        await deleteScratchCard(card.id);
        if (presentingIndex !== null) {
          setPresentingIndex(null);
        }
      },
    });
  };

  // Presentation Mode navigation
  const activePresentedCard = presentingIndex !== null && filteredCards[presentingIndex]
    ? filteredCards[presentingIndex]
    : null;

  const handleNextCard = () => {
    if (presentingIndex === null) return;
    feedback.playClick();
    setIsFlipped(false);
    setPresentingIndex((prev) => (prev! + 1 < filteredCards.length ? prev! + 1 : 0));
  };

  const handlePrevCard = () => {
    if (presentingIndex === null) return;
    feedback.playClick();
    setIsFlipped(false);
    setPresentingIndex((prev) => (prev! - 1 >= 0 ? prev! - 1 : filteredCards.length - 1));
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
  }, [presentingIndex, filteredCards.length]);

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-28 sm:pb-20 md:pb-12 select-none relative z-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-white">
            Scratchpad & Flashcards
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Quick notes, brainstorm cards, and minimal flashcard presentations.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenCreate}
          className="self-start sm:self-auto flex items-center gap-1.5 h-9 px-4 rounded-full font-bold text-xs pressable shadow-md transition-all cursor-pointer"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
          }}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Card</span>
        </motion.button>
      </div>

      {/* 2. Filter Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div
          className="segmented-track flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth"
          style={{ touchAction: 'pan-x' }}
        >
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  feedback.playClick();
                  startTransition(() => {
                    setSelectedCategory(cat);
                  });
                }}
                className={`relative px-3.5 py-1.5 text-xs font-bold rounded-xl pressable whitespace-nowrap transition-colors capitalize cursor-pointer ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="scratchpadCategoryPill"
                    transition={{ type: 'spring', damping: 30, stiffness: 450 }}
                    className="absolute inset-0 rounded-xl"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  />
                )}
                <span className="relative z-10">{cat === 'all' ? `All (${scratchCards.length})` : cat}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60 h-9">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes & flashcards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. 2-Column Responsive Card Grid */}
      <AnimatePresence mode="popLayout">
        {filteredCards.length === 0 ? (
          <motion.div
            key="empty-cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={APPLE_SPRINGS.snappy}
            className="solid-card py-16 px-4 text-center flex flex-col items-center justify-center border shadow-xl"
            style={{ backgroundColor: 'var(--bg-card)' }}
          >
            <Layers className="w-10 h-10 stroke-[1.5] mb-2" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-display text-sm font-semibold text-zinc-300">
              No cards in this deck
            </span>
            <p className="text-xs text-zinc-500 mt-1">Tap "+ New Card" above to jot down a thought or flashcard.</p>
          </motion.div>
        ) : (
          <div
            key={`cards-grid-${selectedCategory}`}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {filteredCards.map((card, idx) => {
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="solid-card p-4 sm:p-5 rounded-2xl flex flex-col justify-between shadow-lg border relative transition-colors group hover:border-white/20"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  {/* Top Row: Category Tag, 2-Sided Badge & Quick Actions */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border uppercase tracking-wider"
                        style={{
                          backgroundColor: `${card.color || 'var(--accent-primary)'}20`,
                          color: card.color || 'var(--accent-primary)',
                          borderColor: `${card.color || 'var(--accent-primary)'}35`,
                        }}
                      >
                        {card.category || 'General'}
                      </span>

                      {card.isTwoSided && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/6 text-zinc-400 border border-white/8 inline-flex items-center gap-1">
                          <RotateCw className="w-2.5 h-2.5" />
                          <span>Flip Side</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(card)}
                        className="opacity-40 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] pressable transition-all cursor-pointer"
                        title="Edit card"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCard(card)}
                        className="opacity-40 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-400 pressable transition-opacity cursor-pointer"
                        title="Delete card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content Area - Clicking opens the note editor menu */}
                  <div
                    className="my-1.5 flex-1 cursor-pointer"
                    onClick={() => {
                      feedback.playClick();
                      handleOpenEdit(card);
                    }}
                  >
                    <h3 className="font-display text-base font-bold text-white tracking-tight leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1.5 line-clamp-3 leading-relaxed whitespace-pre-line font-body">
                      {card.content}
                    </p>
                  </div>

                  {/* Bottom Row: Present Action */}
                  <div className="pt-3 mt-2 hairline-t flex items-center justify-between">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {card.updatedAt ? new Date(card.updatedAt).toLocaleDateString() : 'Recent'}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        feedback.playClick();
                        setIsFlipped(false);
                        setPresentingIndex(idx);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold pressable transition-colors border cursor-pointer hover:border-white/25 text-white"
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        borderColor: 'var(--border-card)',
                      }}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Present</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          FOCUSED FLASHCARD PRESENTATION MODE (PORTAL TO BODY)
          ======================================================== */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {activePresentedCard && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none modal-backdrop">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setPresentingIndex(null)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md"
                  style={{ willChange: 'opacity' }}
                />

                <motion.div
                  initial={{ scale: 0.92, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.92, opacity: 0, y: 15 }}
                  transition={APPLE_SPRINGS.snappy}
                  className="relative w-full max-w-lg solid-card p-6 sm:p-8 rounded-3xl shadow-2xl border flex flex-col justify-between min-h-[380px] z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    willChange: 'transform, opacity',
                  }}
                >
                  {/* Header Bar: Deck Counter, Tag & Close */}
                  <div className="flex items-center justify-between pb-3 hairline-b">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white px-2.5 py-0.5 rounded-full bg-white/10">
                        Card {presentingIndex! + 1} of {filteredCards.length}
                      </span>
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border"
                        style={{
                          backgroundColor: `${activePresentedCard.color || 'var(--accent-primary)'}20`,
                          color: activePresentedCard.color || 'var(--accent-primary)',
                          borderColor: `${activePresentedCard.color || 'var(--accent-primary)'}35`,
                        }}
                      >
                        {activePresentedCard.category || 'General'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(activePresentedCard)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 pressable transition-colors cursor-pointer"
                        title="Edit card"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPresentingIndex(null)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 pressable transition-colors cursor-pointer"
                        title="Close Presentation (Esc)"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Main Card Body with 3D Flip Support */}
                  <div
                    className="my-auto py-8 text-center flex flex-col items-center justify-center cursor-pointer min-h-[180px]"
                    onClick={() => {
                      if (activePresentedCard.isTwoSided) handleFlip();
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {!isFlipped ? (
                        <motion.div
                          key="front"
                          initial={{ opacity: 0, rotateY: -80 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          exit={{ opacity: 0, rotateY: 80 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="w-full flex flex-col items-center"
                        >
                          <h2 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight max-w-md">
                            {activePresentedCard.title}
                          </h2>
                          <p className="text-sm sm:text-base text-zinc-300 mt-4 max-w-md leading-relaxed whitespace-pre-line font-body">
                            {activePresentedCard.content}
                          </p>
                          {activePresentedCard.isTwoSided && (
                            <span className="text-[10px] font-mono text-zinc-500 mt-6 inline-flex items-center gap-1 opacity-75">
                              <RotateCw className="w-3 h-3" /> Tap or press Space to reveal answer
                            </span>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="back"
                          initial={{ opacity: 0, rotateY: 80 }}
                          animate={{ opacity: 1, rotateY: 0 }}
                          exit={{ opacity: 0, rotateY: -80 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="w-full flex flex-col items-center"
                        >
                          <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--accent-primary)] font-bold mb-2">
                            Flip Side (Answer / Notes)
                          </span>
                          <p className="text-sm sm:text-base text-zinc-100 max-w-md leading-relaxed whitespace-pre-line font-body font-medium">
                            {activePresentedCard.backContent || '(No back content entered)'}
                          </p>
                          <span className="text-[10px] font-mono text-zinc-500 mt-6 inline-flex items-center gap-1 opacity-75">
                            <RotateCw className="w-3 h-3" /> Tap to flip back
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Minimalist Deck Controls: Prev / Flip / Next */}
                  <div className="pt-4 hairline-t flex items-center justify-between gap-3">
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
          CARD CREATOR / EDITOR MODAL (PORTAL TO BODY)
          ======================================================== */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none modal-backdrop">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsModalOpen(false)}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md"
                  style={{ willChange: 'opacity' }}
                />

                <motion.div
                  initial={{ scale: 0.94, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.94, opacity: 0, y: 15 }}
                  transition={APPLE_SPRINGS.snappy}
                  className="relative w-full max-w-lg solid-card p-5 sm:p-6 rounded-3xl shadow-2xl border flex flex-col gap-4 z-10 max-h-[90vh] overflow-y-auto no-scrollbar"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    willChange: 'transform, opacity',
                  }}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 hairline-b">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}25`, color }}
                      >
                        <Layers className="w-4 h-4" />
                      </div>
                      <h3 className="font-display text-base font-bold text-white">
                        {editingCard ? 'Edit Flashcard' : 'New Flashcard'}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white pressable cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      Card Title / Topic
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Active Recall, Project Note, Grocery Idea..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  {/* Front Content */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                      Front Side Notes / Question
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Write your note or question here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full p-3 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Optional Two-Sided Flip Toggle */}
                  <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">Add Flip Side (Back)</span>
                          <span className="text-[10px] text-zinc-500 font-mono">For study testing & answers</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsTwoSided((prev) => !prev)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer pressable p-0.5 ${
                          isTwoSided ? 'bg-[var(--accent-primary)]' : 'bg-white/10'
                        }`}
                      >
                        <motion.div
                          animate={{ x: isTwoSided ? 20 : 0 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                          className="w-5 h-5 rounded-full bg-white shadow-md"
                        />
                      </button>
                    </div>

                    {isTwoSided && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2"
                      >
                        <textarea
                          rows={3}
                          placeholder="Enter the answer or back-of-card notes..."
                          value={backContent}
                          onChange={(e) => setBackContent(e.target.value)}
                          className="w-full p-3 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none resize-none"
                        />
                      </motion.div>
                    )}
                  </div>

                  {/* Category & Color Picker */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                        Category Tag
                      </label>
                      <input
                        type="text"
                        placeholder="General, Ideas, Study..."
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl solid-input text-xs text-white placeholder-zinc-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                        Color Accent
                      </label>
                      <div
                        className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1"
                        style={{ touchAction: 'pan-x' }}
                      >
                        {CARD_COLORS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => {
                              feedback.playClick();
                              setColor(c.value);
                            }}
                            className={`w-7 h-7 rounded-full transition-transform pressable cursor-pointer shrink-0 ${
                              color === c.value ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.value }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 hairline-t flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold solid-input text-zinc-400 hover:text-white pressable cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveCard}
                      className="px-5 py-2 rounded-xl text-xs font-bold pressable cursor-pointer shadow-md"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: '#ffffff',
                      }}
                    >
                      {editingCard ? 'Save Changes' : 'Create Card'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
