'use client';

import React, { useState } from 'react';
import { QuizQuestion, QuizAttempt } from '@/lib/types';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  RotateCcw,
  Award,
  Info,
  Calendar,
} from 'lucide-react';
import { useToast } from './Toast';

interface QuizViewProps {
  studySetId: string;
  questions: QuizQuestion[];
  initialAttempts?: QuizAttempt[];
}

export default function QuizView({
  studySetId,
  questions,
  initialAttempts = [],
}: QuizViewProps) {
  const { success, error: toastError } = useToast();

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>(initialAttempts);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (isSubmitted) return; // Prevent changing after submission
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (answeredCount === 0) return;

    // Calculate score
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_index) {
        calculatedScore += 1;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);

    const percentage = Math.round((calculatedScore / totalQuestions) * 100);

    // Trigger celebratory confetti for scores >= 70%
    if (percentage >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#a78bfa', '#60a5fa', '#34d399', '#f472b6'],
        });
      } catch {
        // Fallback if canvas is unavailable
      }
    }

    // Persist attempt score to Supabase via POST /api/quiz-attempts
    setSubmitting(true);
    try {
      const response = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          study_set_id: studySetId,
          score: calculatedScore,
          total: totalQuestions,
        }),
      });

      const data = await response.json();
      if (response.ok && data.attempt) {
        setAttempts((prev) => [data.attempt, ...prev]);
        success('Quiz score recorded!', `You scored ${calculatedScore}/${totalQuestions} (${percentage}%)`);
      }
    } catch (err) {
      console.error('Failed to save quiz attempt:', err);
      toastError('Score recorded locally', 'Could not sync score to cloud database.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(null);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const percentage = score !== null ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            Interactive Knowledge Check
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSubmitted
              ? 'Review your answers, correct solutions, and explanations below.'
              : `Select your best answer for each question (${answeredCount} of ${totalQuestions} answered)`}
          </p>
        </div>

        {isSubmitted && score !== null && (
          <button
            onClick={handleRetake}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retake Quiz
          </button>
        )}
      </div>

      {/* Submission Score Banner */}
      {isSubmitted && score !== null && (
        <div
          className={`p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden transition-all ${
            percentage >= 80
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : percentage >= 50
              ? 'bg-amber-950/40 border-amber-500/40'
              : 'bg-rose-950/40 border-rose-500/40'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg ${
                  percentage >= 80
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : percentage >= 50
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                <Trophy className="w-7 h-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-bold text-white">
                    You Scored {score} / {totalQuestions}
                  </h4>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      percentage >= 80
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : percentage >= 50
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {percentage >= 80
                    ? 'Outstanding mastery! You have a solid grasp of this material.'
                    : percentage >= 50
                    ? 'Good effort! Review the explanations below to reinforce your weaker areas.'
                    : 'Needs review. Consider revisiting the Summary and Flashcards before retaking.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleRetake}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-6">
        {questions.map((question, qIdx) => {
          const userAnswer = selectedAnswers[qIdx];
          const isCorrect = isSubmitted && userAnswer === question.correct_index;

          return (
            <div
              key={qIdx}
              className={`p-6 rounded-2xl border transition-all ${
                isSubmitted
                  ? isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-750'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs shrink-0 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <h4 className="text-base font-semibold text-slate-100 leading-snug">
                    {question.question}
                  </h4>
                </div>

                {isSubmitted && (
                  <span className="shrink-0">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* 4 Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
                {question.options.map((option, optIdx) => {
                  const isSelected = userAnswer === optIdx;
                  const isThisCorrect = optIdx === question.correct_index;

                  let optionStyle =
                    'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700';

                  if (isSubmitted) {
                    if (isThisCorrect) {
                      // Correct option is always highlighted green
                      optionStyle =
                        'bg-emerald-950/70 border-emerald-500/60 text-emerald-200 font-medium ring-1 ring-emerald-500/50';
                    } else if (isSelected && !isThisCorrect) {
                      // Selected incorrect option highlighted red
                      optionStyle =
                        'bg-rose-950/70 border-rose-500/60 text-rose-200 font-medium ring-1 ring-rose-500/50';
                    } else {
                      optionStyle = 'bg-slate-950/40 border-slate-850 text-slate-500 opacity-60';
                    }
                  } else if (isSelected) {
                    optionStyle =
                      'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-medium ring-1 ring-indigo-500/50';
                  }

                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={isSubmitted}
                      onClick={() => handleSelectOption(qIdx, optIdx)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${optionStyle}`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSubmitted && isThisCorrect
                            ? 'bg-emerald-500 text-slate-950'
                            : isSubmitted && isSelected && !isThisCorrect
                            ? 'bg-rose-500 text-white'
                            : isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm leading-relaxed flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Detailed Explanation Box */}
              {isSubmitted && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Explanation: </span>
                    <span className="leading-relaxed">{question.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Quiz Action Button */}
      {!isSubmitted && (
        <div className="sticky bottom-6 z-20 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Progress: <span className="font-semibold text-white">{answeredCount}</span> of{' '}
            <span className="font-semibold text-white">{totalQuestions}</span> questions answered
          </div>

          <button
            type="button"
            disabled={answeredCount === 0 || submitting}
            onClick={handleSubmitQuiz}
            className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all ${
              answeredCount === 0 || submitting
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/25 hover:scale-102'
            }`}
          >
            {submitting ? 'Calculating & Saving...' : 'Submit Quiz & Check Answers'}
          </button>
        </div>
      )}

      {/* Past Quiz Attempts Section */}
      {attempts.length > 0 && (
        <div className="pt-6 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-amber-400" />
            Previous Quiz Attempts ({attempts.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {attempts.map((attempt) => {
              const attemptPct = Math.round((attempt.score / attempt.total) * 100);
              const dateStr = new Date(attempt.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={attempt.id}
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full ${
                      attemptPct >= 80
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : attemptPct >= 50
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {attempt.score}/{attempt.total} ({attemptPct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
