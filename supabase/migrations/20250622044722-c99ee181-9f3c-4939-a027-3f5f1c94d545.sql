
-- Create profiles table that's missing but referenced in the code
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add monthly_budget field to debt_plans table
ALTER TABLE public.debt_plans 
ADD COLUMN monthly_budget NUMERIC;

-- Create categories table that's referenced but missing
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT DEFAULT '💰',
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Update transactions table to match the expected schema
ALTER TABLE public.transactions 
ADD COLUMN category_id UUID REFERENCES public.categories(id),
ADD COLUMN category_name TEXT,
ADD COLUMN currency TEXT DEFAULT 'CLP';

-- Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for categories
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_name)
  VALUES (new.id, new.raw_user_meta_data->>'user_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add some default categories for new users
INSERT INTO public.categories (name, icon, transaction_type, user_id) 
SELECT 'Alimentación', '🍽️', 'expense', id FROM auth.users 
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, icon, transaction_type, user_id) 
SELECT 'Transporte', '🚗', 'expense', id FROM auth.users 
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, icon, transaction_type, user_id) 
SELECT 'Salario', '💼', 'income', id FROM auth.users 
ON CONFLICT DO NOTHING;
