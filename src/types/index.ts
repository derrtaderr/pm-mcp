export interface Framework {
  id: string;
  name: string;
  category: 'prioritization' | 'research' | 'strategy' | 'analysis';
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_time: number;
  success_rate: number;
  usage_count: number;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  steps?: FrameworkStep[];
}

export interface FrameworkStep {
  id: string;
  framework_id: string;
  step_number: number;
  title: string;
  description: string;
  prompt_template: string;
  input_type: 'text' | 'number' | 'scale' | 'multiple_choice' | 'file_upload';
  validation_rules: Record<string, any>;
  next_step_logic: Record<string, any>;
  created_at: string;
}

export interface Prompt {
  id: string;
  name: string;
  category: string;
  task_type: string;
  prompt_template: string;
  variables: Record<string, any>;
  engineering_pattern: 'RTF' | 'TAG' | 'Context-Instruction-Output';
  effectiveness_score: number;
  usage_count: number;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserContext {
  id: string;
  user_id: string;
  email?: string;
  company_info: Record<string, any>;
  industry?: string;
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  preferences: Record<string, any>;
  recent_frameworks: string[];
  subscription_tier: 'free' | 'pro' | 'team' | 'enterprise';
  created_at: string;
  updated_at: string;
}

export interface FrameworkSession {
  id: string;
  user_id: string;
  framework_id: string;
  session_data: Record<string, any>;
  current_step: number;
  completed: boolean;
  completion_time?: number;
  quality_score?: number;
  created_at: string;
  completed_at?: string;
}

export interface WizardSession {
  session_id: string;
  framework_name: string;
  current_step: number;
  total_steps: number;
  step_title: string;
  step_description: string;
  personalized_prompt: string;
  input_type: string;
  validation_rules: Record<string, any>;
  progress_percentage: number;
}

export interface WizardStep {
  session_id: string;
  step_number: number;
  step_title: string;
  step_description: string;
  personalized_prompt: string;
  input_type: string;
  validation_rules: Record<string, any>;
  progress_percentage: number;
  is_final_step: boolean;
}

export interface FrameworkList {
  available_frameworks: Framework[];
  recommendation?: string;
  total_count: number;
}

export interface PromptList {
  available_prompts: Prompt[];
  recommendation?: string;
  total_count: number;
}

export interface CustomizedPrompt {
  prompt_id: string;
  customized_content: string;
  variables_used: Record<string, string>;
  effectiveness_score: number;
}

export interface AnalysisWizard {
  wizard_id: string;
  analysis_type: string;
  steps: WizardStep[];
  context: Record<string, any>;
}

export interface ResearchSynthesis {
  themes: string[];
  insights: string[];
  recommendations: string[];
  confidence_scores: Record<string, number>;
}

export interface PRDSections {
  executive_summary: string;
  problem_statement: string;
  solution_overview: string;
  user_stories: string[];
  acceptance_criteria: string[];
  technical_requirements: string[];
}

export interface UserStories {
  stories: Array<{
    title: string;
    description: string;
    acceptance_criteria?: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  total_count: number;
}

export interface MCPToolArgs {
  category?: string;
  experience_level?: string;
  context?: string;
  framework_name?: string;
  project_context?: string;
  stakeholders?: string[];
  timeline?: string;
  session_id?: string;
  user_response?: string;
  current_step?: number;
  task_type?: string;
  prompt_id?: string;
  variables?: Record<string, string>;
  competitors?: string[];
  focus_areas?: string[];
  industry?: string;
  research_data?: string;
  output_format?: string;
  feature_description?: string;
  template_type?: string;
  acceptance_criteria?: boolean;
  story_format?: string;
}