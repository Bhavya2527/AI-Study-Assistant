'use client';

import React, { useState } from 'react';
import { SummaryData } from '@/lib/types';
import { Copy, Check, Download, BookOpen, Key, CheckCircle, FileText } from 'lucide-react';
import { useToast } from './Toast';

interface SummaryViewProps {
  summary: SummaryData;
  title: string;
  subject?: string;
  originalNotes?: string;
}

export default function SummaryView({
  summary,
  title,
  subject,
  originalNotes,
}: SummaryViewProps) {
  const { success } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopySummary = async () => {
    const textToCopy = `Title: ${title}
Subject: ${subject || 'General'}

OVERVIEW:
${summary.overview}

KEY POINTS:
${summary.key_points.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

KEY TERMS & DEFINITIONS:
${summary.key_terms.map((t) => `• ${t.term}: ${t.definition}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      success('Copied to clipboard!', 'Full study summary copied to your clipboard.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadTxt = () => {
    const content = `================================================================================
AI Study Assistant - Generated Study Summary
================================================================================
Title: ${title}
Subject: ${subject || 'General'}
Date: ${new Date().toLocaleDateString()}

--------------------------------------------------------------------------------
OVERVIEW
--------------------------------------------------------------------------------
${summary.overview}

--------------------------------------------------------------------------------
KEY TAKEAWAYS
--------------------------------------------------------------------------------
${summary.key_points.map((pt, i) => `[${i + 1}] ${pt}`).join('\n\n')}

--------------------------------------------------------------------------------
KEY TERMS & DEFINITIONS
--------------------------------------------------------------------------------
${summary.key_terms.map((t) => `* ${t.term}:\n  ${t.definition}`).join('\n\n')}

${
  originalNotes
    ? `--------------------------------------------------------------------------------
ORIGINAL NOTES EXCERPT
--------------------------------------------------------------------------------
${originalNotes}
`
    : ''
}
================================================================================
Generated with AI Study Assistant (Gemini 2.0 Flash)
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Downloaded summary (.txt)', 'Saved to your computer.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Synthesized Study Guide & Terminology</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadTxt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      {/* 1. Overview Section */}
      <div className="glass-panel rounded-2xl p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2.5 mb-3.5 text-indigo-400 font-semibold text-base">
          <BookOpen className="w-5 h-5" />
          <h3>Core Executive Overview</h3>
        </div>
        <p className="text-slate-200 leading-relaxed text-base sm:text-lg font-normal">
          {summary.overview}
        </p>
      </div>

      {/* 2. Key Points Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <h3>Essential Key Points ({summary.key_points.length})</h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {summary.key_points.map((point, index) => (
            <div
              key={index}
              className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
                {index + 1}
              </span>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Key Terms Section */}
      {summary.key_terms && summary.key_terms.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-base">
            <Key className="w-5 h-5 text-purple-400" />
            <h3>Key Terminology & Definitions ({summary.key_terms.length})</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {summary.key_terms.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="inline-block px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold tracking-wide mb-2.5">
                    {item.term}
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{item.definition}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
