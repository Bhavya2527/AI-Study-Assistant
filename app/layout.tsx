import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'AI Study Assistant | Smart Summaries, Quizzes & Flashcards',
  description:
    'Paste your study notes to instantly generate multi-modal learning assets: an executive summary, interactive MCQ quizzes, and spaced-repetition flashcards powered by Gemini 2.0 Flash.',
  keywords: [
    'AI study assistant',
    'Gemini 2.0 Flash',
    'study summarizer',
    'active recall',
    'MCQ quiz generator',
    'flashcard creator',
  ],
  authors: [{ name: 'AI Study Assistant Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="min-h-screen flex flex-col bg-[#090a0f] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <ToastProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
