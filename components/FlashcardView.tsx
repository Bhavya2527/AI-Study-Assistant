'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Flashcard, FlashcardProgress, FlashcardStatus } from '@/lib/types';
import {
  Rotate3d,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Shuffle,
  Layers,
} from 'lucide-react';
import { useToast } from './Toast';

interface FlashcardViewProps {
  studySetId: string;
  flashcards: Flashcard[];
  initialProgress?: FlashcardProgress[];
}

export default function FlashcardView({
  studySetId,
  flashcards,
  initialProgress = [],
}: FlashcardViewProps) {
  const { success } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [deck, setDeck] = useState<Flashcard[]>(flashcards);

  // Map card_index to status ('known' | 'review')
  const [progressMap, setProgressMap] = useState<Record<number, FlashcardStatus>>(() => {
    const map: Record<number, FlashcardStatus> = {};
    initialProgress.forEach((p) => {
      map[p.card_index] = p.status;
    });
    return map;
  });

  const totalCards = deck.length;
  const currentCard = deck[currentIndex];
  const currentStatus = progressMap[currentIndex];

  // Stats calculation
  const knownCount = Object.values(progressMap).filter((s) => s === 'known').length;
  const reviewCount = Object.values(progressMap).filter((s) => s === 'review').length;

  // Flip toggle
  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Next / Prev navigation
  const handleNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1 < totalCards ? prev + 1 : 0));
  }, [totalCards]);

  const handlePrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : totalCards - 1));
  }, [totalCards]);

  // Mark card as known or review
  const handleMarkStatus = useCallback(
    async (status: FlashcardStatus) => {
      // Optimistic UI update
      setProgressMap((prev) => ({
        ...prev,
        [currentIndex]: status,
      }));

      // Auto-advance to next card after marking
      setTimeout(() => {
        if (currentIndex + 1 < totalCards) {
          handleNext();
        }
      }, 200);

      // Save to database via POST /api/flashcard-progress
      try {
        await fetch('/api/flashcard-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            study_set_id: studySetId,
            card_index: currentIndex,
            status,
          }),
        });
      } catch (err) {
        console.error('Failed to sync flashcard status to DB:', err);
      }
    },
    [currentIndex, handleNext, studySetId, totalCards]
  );

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '1') {
        e.preventDefault();
        handleMarkStatus('known');
      } else if (e.key === '2') {
        e.preventDefault();
        handleMarkStatus('review');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleNext, handlePrev, handleMarkStatus]);

  // Shuffle deck
  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    success('Deck shuffled!');
  };

  if (!currentCard) {
    return <div className="text-center py-8 text-slate-400">No flashcards available.</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Active Recall Flashcards
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Test your memory before revealing the answer. Use keyboard arrows or spacebar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all"
            title="Randomize card order"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
            Shuffle
          </button>
        </div>
      </div>

      {/* Progress & Mastery Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 uppercase font-medium">Card</span>
          <div className="text-base font-bold text-white mt-0.5">
            {currentIndex + 1} <span className="text-xs font-normal text-slate-400">/ {totalCards}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
          <span className="text-[11px] text-emerald-400 uppercase font-medium">Mastered</span>
          <div className="text-base font-bold text-emerald-300 mt-0.5">{knownCount}</div>
        </div>

        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
          <span className="text-[11px] text-amber-400 uppercase font-medium">Review Needed</span>
          <div className="text-base font-bold text-amber-300 mt-0.5">{reviewCount}</div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div className="perspective-1000 max-w-2xl mx-auto w-full min-h-[320px]">
        <div
          onClick={handleFlip}
          className={`relative w-full h-[320px] sm:h-[350px] rounded-3xl cursor-pointer transition-transform duration-500 transform-style-3d shadow-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT SIDE (Prompt / Question) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-8 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-slate-800 hover:border-indigo-500/40 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                Question / Prompt
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Rotate3d className="w-3.5 h-3.5 text-indigo-400" />
                Click or Space to flip
              </span>
            </div>

            <div className="my-auto text-center px-4">
              <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                {currentCard.front}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <span>Card {currentIndex + 1} of {totalCards}</span>
              {currentStatus && (
                <span
                  className={`capitalize px-2 py-0.5 rounded text-[11px] font-semibold ${
                    currentStatus === 'known'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  Marked: {currentStatus}
                </span>
              )}
            </div>
          </div>

          {/* BACK SIDE (Answer / Explanation) */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-8 flex flex-col justify-between bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950/60 border border-indigo-500/50 shadow-indigo-500/10">
            <div className="flex items-center justify-between text-xs">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                Answer / Concept
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Rotate3d className="w-3.5 h-3.5 text-purple-400" />
                Click to flip back
              </span>
            </div>

            <div className="my-auto text-center px-4">
              <p className="text-lg sm:text-xl font-medium text-indigo-100 leading-relaxed">
                {currentCard.back}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-indigo-900/40">
              <span className="text-indigo-300">Prompt: {currentCard.front.slice(0, 30)}...</span>
              <span>Back side</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation & Mastery Action Buttons */}
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Prev Card */}
        <button
          onClick={handlePrev}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous (←)
        </button>

        {/* Status Marking Buttons */}
        <div className="w-full sm:w-auto flex items-center gap-2">
          <button
            onClick={() => handleMarkStatus('review')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
              currentStatus === 'review'
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-amber-950/40 text-amber-200 border-amber-500/40 hover:bg-amber-900/50'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Review Again (2)
          </button>

          <button
            onClick={() => handleMarkStatus('known')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
              currentStatus === 'known'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40 hover:bg-emerald-900/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            I Knew It! (1)
          </button>
        </div>

        {/* Next Card */}
        <button
          onClick={handleNext}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-all"
        >
          Next (→)
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <p className="text-center text-[11px] text-slate-400">
        Keyboard Shortcuts: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Space</kbd> Flip •{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">←</kbd> /{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">→</kbd> Navigate •{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">1</kbd> Mastered •{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">2</kbd> Review
      </p>
    </div>
  );
}
