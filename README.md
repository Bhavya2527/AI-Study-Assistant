# AI Study Assistant 🎓✨
> **A Production-Ready Full-Stack Generative AI Study Platform**  
> Built with **Next.js 14+ (App Router)**, **Tailwind CSS**, **Supabase (PostgreSQL & Auth with RLS)**, and **Google Gemini 2.0 Flash**.

---

## 📋 Table of Contents
1. [Project Overview](#-project-overview)
2. [Evaluation Criteria Verification](#-evaluation-criteria-verification)
3. [Key Features](#-key-features)
4. [System Architecture](#-system-architecture)
5. [Database Schema & Row Level Security](#-database-schema--row-level-security)
6. [LLM Prompt Design & JSON Mode](#-llm-prompt-design--json-mode)
7. [Tech Stack](#-tech-stack)
8. [Project Structure](#-project-structure)
9. [Local Setup Guide (Step-by-Step)](#-local-setup-guide-step-by-step)
10. [Production Deployment Guide (Vercel + Supabase)](#-production-deployment-guide-vercel--supabase)
11. [Final Acceptance Checklist](#-final-acceptance-checklist)
12. [Screenshots Placeholder](#-screenshots-placeholder)

---

## 🌟 Project Overview
**AI Study Assistant** is a full-stack web application designed for students and educators. A user pastes raw study notes (lecture transcripts, textbook chapters, or revision notes). The system makes a single, strictly typed server-side call to **Google Gemini 2.0 Flash** and generates **THREE structured learning assets**:

1. **Executive Summary**: A synthesis overview, 5–7 actionable bullet points, and essential key terms with definitions.
2. **Interactive MCQ Quiz**: Multiple-choice questions with 4 distinct options, score grading, celebration confetti, and explanations for each option. Every attempt is saved to the user's database.
3. **3D Active-Recall Flashcards**: True 3D flip-card UI with keyboard shortcuts and spaced-repetition status tracking (*"I knew it"* vs *"Review again"*), synchronized to the database.

---

## 🎯 Evaluation Criteria Verification

This application was engineered specifically to fulfill the three core capstone requirements:

| # | Evaluator Verification Criterion | Implementation Details | Verification Location |
|---|---|---|---|
| **1** | **LLM API is integrated** (Real call, not mocked) | Real server-side integration calling `gemini-2.0-flash` via `@google/generative-ai` with JSON mode (`responseMimeType: "application/json"`). Zero mocks. | [`lib/gemini.ts`](file:///c:/Users/HP/OneDrive/Desktop/ai%20study%20summariser/lib/gemini.ts) & [`app/api/generate/route.ts`](file:///c:/Users/HP/OneDrive/Desktop/ai%20study%20summariser/app/api/generate/route.ts) |
| **2** | **Structured prompts produce multiple outputs** (Summary + Quiz + Flashcards) | One structured prompt with strict system instructions and typed output schema producing Summary, Quiz (with 4 options & explanation), and Flashcards simultaneously in a single round-trip. | [`lib/prompts.ts`](file:///c:/Users/HP/OneDrive/Desktop/ai%20study%20summariser/lib/prompts.ts) |
| **3** | **Generated content is saved** (and can be viewed later) | Persisted per-user in Supabase Postgres (`study_sets`, `quiz_attempts`, `flashcard_progress`). Protected with Row Level Security (RLS) so users only see their own data. | [`supabase/schema.sql`](file:///c:/Users/HP/OneDrive/Desktop/ai%20study%20summariser/supabase/schema.sql) |

---

## 🚀 Key Features

### 🔐 1. Authentication & Security
- **Email & Password Authentication** using Supabase Auth.
- **Isolated User Storage**: Every study set, quiz attempt, and flashcard progress record is bound to `auth.uid()`.
- **Strict Row Level Security (RLS)** enabled on all 4 database tables.
- **Server-Side Route Handlers**: API routes never trust client-supplied `user_id`; sessions are validated directly via cookies.
- **Protected Routes**: `/dashboard`, `/new`, and `/notes/[id]` redirect unauthenticated visitors to `/login`.
- **Rate Limiting**: Simple server-side rate limit allows a maximum of 10 generations per user per hour.

### 📝 2. Study Set Creator (`/new`)
- Large text area with **live character counter** (enforcing 100 to 8,000 characters).
- Optional fields: Title, Subject, Number of Quiz Questions (5 or 10), Number of Flashcards (5, 10, or 15), Difficulty (Easy, Medium, Hard).
- **1-Click Sample Notes Presets**: Load pre-populated study notes on *Cellular Respiration (Biology)*, *Database ACID Properties (Computer Science)*, or *Industrial Revolution (History)* to test the full pipeline in one click.
- Visual step progression during generation (`Analyzing notes...`, `Synthesizing materials...`, `Saving to database...`).

### 📖 3. Interactive Result Page (`/notes/[id]`)
- **Executive Summary Tab**:
  - High-level overview paragraph.
  - 5 to 7 prioritized key takeaways with numbered badges.
  - Key Terms & Definitions cards.
  - "Copy Summary to Clipboard" and "Download as .txt" buttons.
- **Interactive Quiz Tab**:
  - 4-choice questions with clear selection states.
  - Immediate score grading with percentage badge.
  - **Celebration Confetti** when scoring 70% or higher.
  - Green/Red highlighting showing correct answers and user choices.
  - Explanations for every question based strictly on the text.
  - "Retake Quiz" button with persistent score history logged in `quiz_attempts`.
- **Active-Recall Flashcards Tab**:
  - Realistic 3D card flip animation on click or Spacebar.
  - Full keyboard shortcuts: `Space` (flip), `←` (previous), `→` (next), `1` (mastered), `2` (review).
  - Progress counters (*Mastered*, *Review Needed*, *Card X of Y*).
  - Syncs mastery state to `flashcard_progress` table.
- **Note Actions**: Regenerate note variation with Gemini, delete note with confirmation dialog.

### 📊 4. Personal Vault Dashboard (`/dashboard`)
- List of all saved study sets with creation dates, question/card counts, and best quiz score pills.
- Real-time search by note title or subject.
- Subject filter dropdown.
- Overview metrics: Active Sets, Total Questions, Total Flashcards.
- Friendly empty state with quick action to create your first set.

### 🌐 5. Responsive Landing Page (`/`)
- Modern dark-mode interface with glassmorphic cards and glowing gradients.
- Interactive live preview showcase of the 3 outputs.
- 3-step "How It Works" section.
- Academic Evaluator Verification card.
- Comprehensive footer with branding, student info, and copyright year.

---

## 🏗 System Architecture

```
                                  +------------------------------+
                                  |         Next.js Client       |
                                  |  (React 19, Tailwind CSS)    |
                                  +--------------+---------------+
                                                 |
                       HTTPS Requests (Cookies)  |
                                                 v
                      +------------------------------------------+
                      |         Next.js Server (App Router)      |
                      |  - Middleware Session Route Guard        |
                      |  - Server-Side Route Handlers (/api/*)   |
                      |  - Zod Request & Response Validation     |
                      +-------------+----------------------+-----+
                                    |                      |
            Internal Server-Side    |                      |  Server-Side Supabase Client
            API Call (GEMINI_KEY)   |                      |  (Session Auth Token)
                                    v                      v
                       +-------------------------+   +---------------------------+
                       | Google Gemini 2.0 Flash |   |   Supabase PostgreSQL     |
                       | - JSON Mode Enforcement |   | - profiles                |
                       | - Zero-Hallucination    |   | - study_sets              |
                       | - Summary+Quiz+Cards    |   | - quiz_attempts           |
                       +-------------------------+   | - flashcard_progress      |
                                                     | - Row Level Security (RLS)|
                                                     +---------------------------+
```

---

## 🗄 Database Schema & Row Level Security

The database schema is defined in [`supabase/schema.sql`](file:///c:/Users/HP/OneDrive/Desktop/ai%20study%20summariser/supabase/schema.sql).

### Tables Overview
1. **`profiles`**: User metadata linked to `auth.users(id)` with an automatic creation trigger on signup.
2. **`study_sets`**: Stores the raw notes, generated JSON summary, quiz array, and flashcards array per user.
3. **`quiz_attempts`**: Tracks user scores, totals, and timestamps for each quiz attempt.
4. **`flashcard_progress`**: Tracks `known` vs `review` status for each individual card index.

### Row Level Security (RLS) Policy Summary
| Table | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
|---|---|---|---|---|
| `profiles` | `auth.uid() = id` | `auth.uid() = id` | `auth.uid() = id` | CASCADE with user |
| `study_sets` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `quiz_attempts` | `auth.uid() = user_id` | `auth.uid() = user_id` | N/A | `auth.uid() = user_id` |
| `flashcard_progress` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |

---

## 🧠 LLM Prompt Design & JSON Mode

Located in [`lib/prompts.ts`](file:///c:/Users/HP/OneDrive/Desktop/ai%20study%20summariser/lib/prompts.ts).

### System Instruction
```
You are an expert study assistant and academic curriculum designer. Use ONLY the provided notes. Do not invent facts.

Your primary objective is to analyze the student's study notes and generate THREE complementary learning assets in a single valid JSON object:
1. SUMMARY: A concise overview paragraph, 5 to 7 high-impact key bullet points, and essential key terms with their exact definitions.
2. QUIZ: Multiple-choice questions with exactly 4 distinct options, exactly 1 unambiguously correct option, a 0-based correct_index, and a clear academic explanation.
3. FLASHCARDS: High-utility active-recall flashcard pairs (front prompt and back answer) optimized for spaced repetition.
```

### JSON Schema Output Structure
```json
{
  "summary": {
    "overview": "string (2-4 sentences)",
    "key_points": ["string (5-7 points)"],
    "key_terms": [{ "term": "string", "definition": "string" }]
  },
  "quiz": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_index": 0,
      "explanation": "string"
    }
  ],
  "flashcards": [
    {
      "front": "string",
      "back": "string"
    }
  ]
}
```

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS v4, Glassmorphism, 3D CSS Transforms
- **Generative AI**: Google Gemini 2.0 Flash (`@google/generative-ai`)
- **Backend & Database**: Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **Session & Cookie Management**: `@supabase/ssr`
- **Validation**: Zod
- **Icons**: Lucide React
- **Animations & Effects**: Canvas Confetti

---

## 📁 Project Structure

```
ai-study-assistant/
├── app/
│   ├── api/
│   │   ├── flashcard-progress/
│   │   │   └── route.ts         # POST: save known/review card status
│   │   ├── generate/
│   │   │   └── route.ts         # POST: rate-limited Gemini call & save
│   │   ├── quiz-attempts/
│   │   │   └── route.ts         # POST: save quiz score to DB
│   │   ├── study-sets/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts     # GET / DELETE individual study set
│   │   │   └── route.ts         # GET: list user's study sets
│   │   └── auth/callback/
│   │       └── route.ts         # Supabase Auth code exchange handler
│   ├── dashboard/
│   │   └── page.tsx             # User study vault & stats
│   ├── login/
│   │   └── page.tsx             # Sign in with email & password
│   ├── new/
│   │   └── page.tsx             # Note creation page
│   ├── notes/
│   │   └── [id]/
│   │       └── page.tsx         # Results page (Summary, Quiz, Flashcards)
│   ├── signup/
│   │   └── page.tsx             # Sign up with auto-profile trigger
│   ├── globals.css              # Glassmorphism, 3D card flips, dark mode
│   ├── layout.tsx               # Root layout with Navbar, Footer & Toasts
│   └── page.tsx                 # Landing page
├── components/
│   ├── FlashcardView.tsx        # 3D Flip-card UI with keyboard shortcuts
│   ├── Footer.tsx               # Header-to-footer PDF friendly footer
│   ├── Navbar.tsx               # Responsive nav with Supabase session state
│   ├── NoteForm.tsx             # Textarea, char counter, 1-click samples
│   ├── QuizView.tsx             # Interactive MCQ quiz with confetti
│   ├── StudySetCard.tsx         # Dashboard card with stats & delete
│   ├── SummaryView.tsx          # Key points, terms, copy & download
│   └── Toast.tsx                # Accessible toast notifications
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client (@supabase/ssr)
│   │   ├── middleware.ts        # Session update & route guard helper
│   │   └── server.ts            # Server Supabase client with cookies
│   ├── gemini.ts                # Gemini 2.0 Flash client with JSON fallback
│   ├── prompts.ts               # Structured system instruction & schema
│   ├── types.ts                 # TypeScript interfaces
│   └── validators.ts            # Zod validation schemas
├── supabase/
│   └── schema.sql               # Full PostgreSQL schema with RLS & trigger
├── middleware.ts                # Next.js route protection middleware
├── .env.example                 # Environment variables template
├── .gitignore                   # Excludes .env.local, includes .env.example
├── next.config.ts               # Next.js configuration
├── package.json                 # Project dependencies
└── README.md                    # Comprehensive documentation
```

---

## 💻 Local Setup Guide (Step-by-Step)

### Prerequisites
- Node.js 18+ (Node 20 or 24 recommended)
- A free [Google AI Studio](https://aistudio.google.com/) account
- A free [Supabase](https://supabase.com/) account

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/ai-study-assistant.git
cd ai-study-assistant
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Supabase Database
1. Go to [Supabase](https://supabase.com) and create a new project.
2. Navigate to **SQL Editor** in the left sidebar.
3. Open [`supabase/schema.sql`](supabase/schema.sql), copy its entire content, paste it into the SQL Editor, and click **Run**.
4. Navigate to **Project Settings > API** and copy:
   - **Project URL**
   - **anon / public key**

### Step 4: Get Google Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Click **Get API Key** and create a new key (free tier is fully supported).

### Step 5: Configure Environment Variables
Duplicate `.env.example` into `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials inside `.env.local`:
```env
GEMINI_API_KEY=AIzaSy...your_real_gemini_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 6: Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 Production Deployment Guide (Vercel + Supabase)

### Step 1: Push Code to GitHub
```bash
# Initialize git (if not already done)
git init

# Stage all files
git add .

# Create initial commit
git commit -m "feat: complete AI Study Assistant with Gemini 2.0 Flash, Supabase RLS, and Next.js 14+"

# Push to your public GitHub repo
git branch -M main
git remote add origin https://github.com/your-username/ai-study-assistant.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [Vercel](https://vercel.com) and log in with GitHub.
2. Click **Add New... > Project** and import `ai-study-assistant`.
3. In **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google AI Studio key)*
   - `NEXT_PUBLIC_SUPABASE_URL`: *(Your Supabase Project URL)*
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: *(Your Supabase Anon key)*
   - `NEXT_PUBLIC_SITE_URL`: `https://your-vercel-domain.vercel.app`
4. Click **Deploy**. Vercel will build and deploy the production bundle in ~1 minute.

### Step 3: Update Supabase Auth Redirect URLs
1. In your **Supabase Dashboard**, navigate to **Authentication > URL Configuration**.
2. Set **Site URL** to:
   ```
   https://your-vercel-domain.vercel.app
   ```
3. Add to **Redirect URLs**:
   ```
   https://your-vercel-domain.vercel.app/**
   https://your-vercel-domain.vercel.app/auth/callback
   http://localhost:3000/**
   ```
4. Click **Save**.

---

## ✅ Final Acceptance Checklist

Verify before evaluation submission:
- [x] **Sign Up & Auth**: Created two distinct accounts; verified that User A cannot see User B's study sets or quiz attempts (RLS enforced).
- [x] **Real LLM API**: Real server-side API call made to `gemini-2.0-flash`.
- [x] **Multi-Output Structured Generation**: Summary (overview, bullets, terms), Quiz (4 choices, correct answer, explanation), and Flashcards generated together in one request.
- [x] **Persistent Cloud Storage**: Study sets, quiz scores, and card mastery states reload after page refresh or logout/login.
- [x] **Quiz Scoring & Attempts**: Quiz grades immediately, displays confetti on high score, and logs score to `quiz_attempts`.
- [x] **Flashcard Mastery**: 3D flip card allows marking "I knew it" or "Review again" with live progress indicators.
- [x] **Delete & Regeneration**: Deletion cleanly cascades; regeneration creates a fresh AI study set.
- [x] **Responsive UI**: Fully tested and styled for mobile, tablet, and desktop screens.
- [x] **Security**: No API keys exposed to client bundles; `.env.local` strictly in `.gitignore`.
- [x] **Full-Page Screenshot**: Header and footer visible in full-page PDF/screenshots.

---

## 📸 Screenshots Placeholder

| Landing Page & Hero | Note Generator (`/new`) |
|:---:|:---:|
| *(Add your screenshot here)* | *(Add your screenshot here)* |

| Executive Summary Tab | Interactive Quiz Tab |
|:---:|:---:|
| *(Add your screenshot here)* | *(Add your screenshot here)* |

| 3D Flashcards Tab | Study Vault Dashboard |
|:---:|:---:|
| *(Add your screenshot here)* | *(Add your screenshot here)* |
