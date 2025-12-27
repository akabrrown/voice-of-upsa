-- Migration to add 'scheduled' to article_status enum
-- Usage: Run this in Supabase SQL Editor

ALTER TYPE public.article_status ADD VALUE IF NOT EXISTS 'scheduled';
