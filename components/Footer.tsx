'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Shield, Cpu, Database, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-md">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                AI Study Assistant
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Transform raw study notes into structured, interactive learning sets in seconds.
              Powered by Google Gemini 2.0 Flash, Next.js 14+ App Router, and Supabase Postgres
              with strict Row Level Security.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-800 text-indigo-400">
                <Cpu className="w-3 h-3" /> Gemini 2.0 Flash
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-800 text-emerald-400">
                <Database className="w-3 h-3" /> Supabase RLS
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-900 border border-slate-800 text-purple-400">
                <Shield className="w-3 h-3" /> Per-User Data Isolation
              </span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-indigo-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/new" className="hover:text-indigo-400 transition-colors">
                  New Study Set
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-indigo-400 transition-colors">
                  Sign In / Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Academic Evaluation Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase">Project Info</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>College Gen AI Project</li>
              <li>LLM: Google Gemini API</li>
              <li>Storage: Supabase PostgreSQL</li>
              <li>Deployment: Vercel Production</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {currentYear} AI Study Assistant. All rights reserved. Created for Generative AI Capstone.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for accelerated learning
          </p>
        </div>
      </div>
    </footer>
  );
}
