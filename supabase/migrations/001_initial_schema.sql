-- AI PM MCP Database Schema
-- Initial migration to create all required tables and relationships

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'team', 'enterprise');
CREATE TYPE experience_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE framework_category AS ENUM ('prioritization', 'research', 'strategy', 'analysis');
CREATE TYPE input_type AS ENUM ('text', 'number', 'scale', 'multiple_choice', 'file_upload');
CREATE TYPE engineering_pattern AS ENUM ('RTF', 'TAG', 'Context-Instruction-Output');

-- Core Frameworks Storage
CREATE TABLE frameworks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category framework_category NOT NULL,
  description TEXT,
  difficulty_level experience_level DEFAULT 'intermediate',
  estimated_time INTEGER DEFAULT 15, -- minutes to complete
  success_rate DECIMAL(3,2) DEFAULT 0.85, -- tracked completion rate
  usage_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Framework Steps (Interactive Wizard Logic)
CREATE TABLE framework_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  prompt_template TEXT NOT NULL, -- The actual prompt for this step
  input_type input_type DEFAULT 'text',
  validation_rules JSONB DEFAULT '{}', -- JSON schema for input validation
  next_step_logic JSONB DEFAULT '{}', -- Conditional logic for next step
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(framework_id, step_number)
);

-- Optimized Prompts Library
CREATE TABLE prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  task_type VARCHAR(100) NOT NULL,
  prompt_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- Template variables like {{company}}, {{competitors}}
  engineering_pattern engineering_pattern DEFAULT 'RTF',
  effectiveness_score DECIMAL(3,2) DEFAULT 0.80,
  usage_count INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Context & Personalization
CREATE TABLE user_contexts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  company_info JSONB DEFAULT '{}',
  industry VARCHAR(100),
  experience_level experience_level DEFAULT 'intermediate',
  preferences JSONB DEFAULT '{}',
  recent_frameworks JSONB DEFAULT '[]',
  subscription_tier subscription_tier DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Framework Usage Sessions
CREATE TABLE framework_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES user_contexts(user_id),
  framework_id UUID REFERENCES frameworks(id),
  session_data JSONB DEFAULT '{}', -- Store step responses, current state
  current_step INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT FALSE,
  completion_time INTEGER, -- minutes taken to complete
  quality_score DECIMAL(3,2), -- user-rated quality of output
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Usage Analytics
CREATE TABLE usage_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255),
  action_type VARCHAR(100), -- 'framework_started', 'framework_completed', 'prompt_used'
  resource_id UUID, -- framework_id or prompt_id
  resource_type VARCHAR(50), -- 'framework', 'prompt'
  session_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_frameworks_category ON frameworks(category);
CREATE INDEX idx_frameworks_difficulty ON frameworks(difficulty_level);
CREATE INDEX idx_frameworks_premium ON frameworks(is_premium);
CREATE INDEX idx_framework_steps_framework_id ON framework_steps(framework_id);
CREATE INDEX idx_framework_steps_step_number ON framework_steps(framework_id, step_number);
CREATE INDEX idx_prompts_task_type ON prompts(task_type);
CREATE INDEX idx_prompts_category ON prompts(category);
CREATE INDEX idx_prompts_premium ON prompts(is_premium);
CREATE INDEX idx_user_contexts_user_id ON user_contexts(user_id);
CREATE INDEX idx_framework_sessions_user_id ON framework_sessions(user_id);
CREATE INDEX idx_framework_sessions_framework_id ON framework_sessions(framework_id);
CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_created_at ON usage_analytics(created_at);

-- Enable Row Level Security for Multi-tenancy
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public access to free content
CREATE POLICY "Public frameworks access" ON frameworks FOR SELECT USING (NOT is_premium);
CREATE POLICY "All framework steps access" ON framework_steps FOR SELECT USING (true);
CREATE POLICY "Public prompts access" ON prompts FOR SELECT USING (NOT is_premium);

-- RLS Policies for premium content (requires authentication)
CREATE POLICY "Premium frameworks access" ON frameworks FOR SELECT USING (
  is_premium AND auth.jwt() ->> 'sub' IS NOT NULL
);

CREATE POLICY "Premium prompts access" ON prompts FOR SELECT USING (
  is_premium AND auth.jwt() ->> 'sub' IS NOT NULL
);

-- RLS Policies for user-specific data
CREATE POLICY "Users can access own context" ON user_contexts 
  FOR ALL USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can access own sessions" ON framework_sessions 
  FOR ALL USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can access own analytics" ON usage_analytics 
  FOR ALL USING (user_id = auth.jwt() ->> 'sub');

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_frameworks_updated_at BEFORE UPDATE ON frameworks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_contexts_updated_at BEFORE UPDATE ON user_contexts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage counts
CREATE OR REPLACE FUNCTION increment_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'usage_analytics' THEN
    IF NEW.resource_type = 'framework' THEN
      UPDATE frameworks SET usage_count = usage_count + 1 WHERE id = NEW.resource_id;
    ELSIF NEW.resource_type = 'prompt' THEN
      UPDATE prompts SET usage_count = usage_count + 1 WHERE id = NEW.resource_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically increment usage counts
CREATE TRIGGER increment_resource_usage_count AFTER INSERT ON usage_analytics 
  FOR EACH ROW EXECUTE FUNCTION increment_usage_count();