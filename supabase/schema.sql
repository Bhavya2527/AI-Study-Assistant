-- ==============================================================================
-- AI Study Assistant - Supabase Database Schema
-- Run this complete script inside the Supabase SQL Editor
-- ==============================================================================

-- 1. Enable UUID Extension (usually enabled by default in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- TABLE 1: PROFILES
-- Stores user profile data linked to auth.users
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TABLE 2: STUDY_SETS
-- Stores generated study sets: summary, quiz, and flashcards per user
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.study_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT,
    original_notes TEXT NOT NULL,
    summary JSONB NOT NULL,
    quiz JSONB NOT NULL,
    flashcards JSONB NOT NULL,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TABLE 3: QUIZ_ATTEMPTS
-- Tracks user scores on quizzes for progress measurement
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_set_id UUID NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    score INT NOT NULL,
    total INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- TABLE 4: FLASHCARD_PROGRESS
-- Tracks mastered ('known') and needs-practice ('review') flashcards per user
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.flashcard_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_set_id UUID NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_index INT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('known', 'review')),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_user_set_card UNIQUE (user_id, study_set_id, card_index)
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_study_sets_user_id ON public.study_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sets_created_at ON public.study_sets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_set ON public.quiz_attempts(user_id, study_set_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_set_id ON public.quiz_attempts(study_set_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_progress_user_set ON public.flashcard_progress(user_id, study_set_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict isolation: users can ONLY ever access or manipulate their own rows
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_progress ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Study Sets Policies
CREATE POLICY "Users can select own study sets"
    ON public.study_sets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study sets"
    ON public.study_sets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sets"
    ON public.study_sets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sets"
    ON public.study_sets FOR DELETE
    USING (auth.uid() = user_id);

-- Quiz Attempts Policies
CREATE POLICY "Users can select own quiz attempts"
    ON public.quiz_attempts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
    ON public.quiz_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz attempts"
    ON public.quiz_attempts FOR DELETE
    USING (auth.uid() = user_id);

-- Flashcard Progress Policies
CREATE POLICY "Users can select own flashcard progress"
    ON public.flashcard_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard progress"
    ON public.flashcard_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard progress"
    ON public.flashcard_progress FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard progress"
    ON public.flashcard_progress FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- Automatically adds a row to public.profiles whenever a new user signs up in auth.users
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Drop trigger if it already exists, then re-create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
