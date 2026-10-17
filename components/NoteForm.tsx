'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  Sliders,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useToast } from './Toast';

// Pre-defined sample notes so evaluators and students can test the full pipeline in 1 click
const SAMPLE_NOTES = [
  {
    title: 'Cellular Respiration & ATP Synthesis',
    subject: 'Biology',
    difficulty: 'medium' as const,
    numQuestions: 5 as const,
    numCards: 5 as const,
    content: `Cellular respiration is the biochemical process by which organisms combine oxygen with foodstuff molecules, diverting the chemical energy into life-sustaining activities and discarding carbon dioxide and water as waste products. Organisms that do not depend on oxygen degrade foodstuffs in a process called fermentation.

The process of aerobic cellular respiration unfolds in three major stages:
1. Glycolysis: Takes place in the cytoplasm. A single six-carbon glucose molecule is broken down into two three-carbon pyruvate molecules, yielding a net gain of 2 ATP and 2 NADH molecules. Oxygen is not required for glycolysis.
2. The Citric Acid Cycle (Krebs Cycle): Occurs inside the mitochondrial matrix. Pyruvate is converted to acetyl-CoA, releasing CO2. The cycle consumes acetyl-CoA and produces 2 ATP, 6 NADH, and 2 FADH2 per glucose molecule.
3. Oxidative Phosphorylation & Electron Transport Chain (ETC): Situated on the inner mitochondrial membrane (cristae). High-energy electrons from NADH and FADH2 move down protein complexes, pumping protons (H+) into the intermembrane space. This creates an electrochemical proton gradient. Protons flow back through ATP synthase (chemiosmosis), generating approximately 26 to 28 ATP molecules. In total, aerobic respiration produces roughly 30-32 ATP molecules per oxidized glucose molecule. Oxygen acts as the terminal electron acceptor, binding protons to form water (H2O).`,
  },
  {
    title: 'Relational Database Transactions & ACID Properties',
    subject: 'Computer Science',
    difficulty: 'hard' as const,
    numQuestions: 5 as const,
    numCards: 5 as const,
    content: `A database transaction represents a single logical unit of work that accesses and potentially modifies database contents. Transactions must maintain data integrity even in the event of hardware failures or concurrent client access. This integrity is governed by the ACID properties:

1. Atomicity: The "all-or-nothing" rule. Either all operations within a transaction commit successfully, or all changes are rolled back to the original state. If a system failure occurs during a bank funds transfer between debit and credit steps, atomicity ensures no money vanishes.
2. Consistency: Ensures that any transaction moves the database from one valid state conforming to all declared schema rules, constraints, triggers, and cascades to another valid state.
3. Isolation: Determines how transaction integrity is visible to other users and systems. Multiple concurrent transactions execute as if they were running serially. Concurrency phenomena include dirty reads (reading uncommitted changes), non-repeatable reads (re-reading data finds updates from another committed transaction), and phantom reads. Standard SQL isolation levels include Read Uncommitted, Read Committed, Repeatable Read, and Serializable.
4. Durability: Guarantees that once a transaction commits, its modifications are permanently recorded in non-volatile storage (such as disk or write-ahead logs, WAL) and will not be lost, even in the event of an abrupt power outage or system crash.`,
  },
  {
    title: 'The Industrial Revolution: Mechanization & Urbanization',
    subject: 'History',
    difficulty: 'easy' as const,
    numQuestions: 5 as const,
    numCards: 5 as const,
    content: `The Industrial Revolution was the transition from agrarian, handicraft economies to ones dominated by industry and machine manufacturing. Originating in Great Britain during the mid-18th century (roughly 1760 to 1840), it fundamentally transformed global society.

Key catalysts for Britain's industrialization included:
- Abundant natural deposits of coal and iron ore, providing energy and raw building material.
- Technological breakthroughs: James Watt's improved steam engine provided reliable mechanical power independent of flowing water. James Hargreaves' Spinning Jenny and Richard Arkwright's Water Frame revolutionized textile manufacturing.
- Capital accumulation and colonial trade networks, which supplied raw cotton and created vast export markets.
- Agrarian improvements: Enclosure acts and selective breeding freed up agricultural labor, prompting mass rural-to-urban migration. Cities like Manchester and Birmingham expanded rapidly, giving rise to factory labor, trade unions, and an emergent industrial middle class, alongside challenges such as child labor and urban pollution.`,
  },
];

export default function NoteForm() {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [numQuizQuestions, setNumQuizQuestions] = useState<5 | 10>(5);
  const [numFlashcards, setNumFlashcards] = useState<5 | 10 | 15>(5);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const charCount = notes.length;
  const isTooShort = charCount < 100;
  const isTooLong = charCount > 8000;
  const isValidLength = !isTooShort && !isTooLong;

  const handleLoadSample = (sample: typeof SAMPLE_NOTES[0]) => {
    setNotes(sample.content);
    setTitle(sample.title);
    setSubject(sample.subject);
    setDifficulty(sample.difficulty);
    setNumQuizQuestions(sample.numQuestions);
    setNumFlashcards(sample.numCards);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (charCount < 100) {
      setErrorMessage('Notes must be at least 100 characters long. Please add more context or load a sample note.');
      return;
    }
    if (charCount > 8000) {
      setErrorMessage('Notes must not exceed 8,000 characters. Please condense your notes.');
      return;
    }

    setLoading(true);
    setLoadingStep('Analyzing notes with Google Gemini 2.0 Flash...');

    try {
      // Step simulator for friendly visual feedback
      const timer1 = setTimeout(() => {
        setLoadingStep('Synthesizing Summary, Quiz Questions & Flashcards...');
      }, 2000);

      const timer2 = setTimeout(() => {
        setLoadingStep('Validating JSON schema and saving to isolated Supabase database...');
      }, 4000);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          title: title.trim() || undefined,
          subject: subject.trim() || undefined,
          numQuizQuestions,
          numFlashcards,
          difficulty,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate study materials.');
      }

      toastSuccess('Study set created successfully!', 'Redirecting to your study set...');
      router.push(`/notes/${data.id}`);
    } catch (err: unknown) {
      console.error('Generation submission error:', err);
      const msg =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during generation.';
      setErrorMessage(msg);
      toastError('Generation Failed', msg);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Quick Test Demo Presets */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Quick Test: Load Pre-populated Sample Notes</span>
          </div>
          <span className="text-xs text-slate-400">1-click demo for evaluator testing</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_NOTES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleLoadSample(sample)}
              className="text-left p-3 rounded-xl bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800/80 hover:border-indigo-500/40 transition-all text-xs group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                {sample.title}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                <span>{sample.subject}</span>
                <span className="capitalize text-slate-400">{sample.difficulty}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 relative">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Notes Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="study-notes"
                className="text-sm font-semibold text-slate-200 flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                Paste Your Study Notes <span className="text-rose-400">*</span>
              </label>

              {/* Character Counter */}
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`font-mono font-medium ${
                    isTooShort
                      ? 'text-amber-400'
                      : isTooLong
                      ? 'text-rose-400 font-bold'
                      : 'text-emerald-400'
                  }`}
                >
                  {charCount} / 8,000 chars
                </span>
                {isTooShort && (
                  <span className="text-slate-400 hidden sm:inline">(min 100 needed)</span>
                )}
              </div>
            </div>

            <textarea
              id="study-notes"
              rows={9}
              disabled={loading}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Paste lecture notes, textbook chapters, study summaries, or meeting transcripts here (minimum 100 characters)..."
              className="w-full px-4 py-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-sans text-sm leading-relaxed resize-y transition-all"
            />
          </div>

          {/* Configuration Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Title (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor="set-title" className="text-xs font-semibold text-slate-300">
                Title (Optional)
              </label>
              <input
                id="set-title"
                type="text"
                disabled={loading}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4 Cellular Bio"
                className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Subject (Optional) */}
            <div className="space-y-1.5">
              <label htmlFor="set-subject" className="text-xs font-semibold text-slate-300">
                Subject
              </label>
              <input
                id="set-subject"
                type="text"
                disabled={loading}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology, CS, History"
                className="w-full px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Number of Quiz Questions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-indigo-400" />
                Quiz Questions
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={loading}
                    onClick={() => setNumQuizQuestions(num as 5 | 10)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                      numQuizQuestions === num
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Flashcards */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Layers className="w-3 h-3 text-purple-400" />
                Flashcards
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[5, 10, 15].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={loading}
                    onClick={() => setNumFlashcards(num as 5 | 10 | 15)}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                      numFlashcards === num
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {num} Cards
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Sliders className="w-3 h-3 text-indigo-400" />
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2 sm:max-w-md">
              {(['easy', 'medium', 'hard'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  disabled={loading}
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg capitalize border transition-all ${
                    difficulty === lvl
                      ? lvl === 'easy'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                        : lvl === 'medium'
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-rose-600/30 border-rose-500 text-rose-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to generate study set</p>
                <p className="mt-0.5 opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Submit Button & Status Indicator */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !isValidLength}
              className={`w-full py-4 px-6 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-xl transition-all ${
                loading || !isValidLength
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-indigo-600/25 hover:shadow-indigo-600/40 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>{loadingStep || 'Generating study assets with Gemini...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate Complete Study Set (Summary + Quiz + Flashcards)</span>
                </>
              )}
            </button>
            {!isValidLength && (
              <p className="text-center text-xs text-slate-400 mt-2">
                {isTooShort
                  ? `Please enter at least 100 characters (${100 - charCount} more characters required)`
                  : 'Note length exceeds 8,000 characters limit'}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
