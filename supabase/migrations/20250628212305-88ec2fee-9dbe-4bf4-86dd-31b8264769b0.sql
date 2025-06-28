
-- Enable RLS on all tables that don't have it yet
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_education_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements table
CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own achievements" ON public.achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON public.achievements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements" ON public.achievements
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for ai_chat_history table
CREATE POLICY "Users can view own chat history" ON public.ai_chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat history" ON public.ai_chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat history" ON public.ai_chat_history
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history" ON public.ai_chat_history
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for budget_snapshots table
CREATE POLICY "Users can view own budget snapshots" ON public.budget_snapshots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budget snapshots" ON public.budget_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget snapshots" ON public.budget_snapshots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget snapshots" ON public.budget_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for financial_health_scores table
CREATE POLICY "Users can view own health scores" ON public.financial_health_scores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own health scores" ON public.financial_health_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health scores" ON public.financial_health_scores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own health scores" ON public.financial_health_scores
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for gamification_events table
CREATE POLICY "Users can view own gamification events" ON public.gamification_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own gamification events" ON public.gamification_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification events" ON public.gamification_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gamification events" ON public.gamification_events
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for savings_goals table
CREATE POLICY "Users can view own savings goals" ON public.savings_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own savings goals" ON public.savings_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own savings goals" ON public.savings_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own savings goals" ON public.savings_goals
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for transactions table
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_education_progress table
CREATE POLICY "Users can view own education progress" ON public.user_education_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own education progress" ON public.user_education_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own education progress" ON public.user_education_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own education progress" ON public.user_education_progress
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_preferences table
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Special policies for education_modules (public read access)
ALTER TABLE public.education_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active education modules" ON public.education_modules
  FOR SELECT USING (is_active = true);

-- Admin-only policies for education_modules management
CREATE POLICY "Admins can manage education modules" ON public.education_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Ensure user_id columns are NOT NULL where they should be
ALTER TABLE public.achievements ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.ai_chat_history ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.budget_snapshots ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.financial_health_scores ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.gamification_events ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.savings_goals ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_education_progress ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_preferences ALTER COLUMN user_id SET NOT NULL;

-- Create indexes for better RLS performance
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user_id ON public.ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_snapshots_user_id ON public.budget_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_health_scores_user_id ON public.financial_health_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_events_user_id ON public.gamification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_education_progress_user_id ON public.user_education_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
