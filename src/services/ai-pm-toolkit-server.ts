import { getSupabaseClient } from '../lib/supabase.js';
import {
  Framework,
  FrameworkList,
  FrameworkSession,
  WizardSession,
  WizardStep,
  PromptList,
  CustomizedPrompt,
  MCPToolArgs,
} from '../types/index.js';

export class AIPMToolkitServer {
  private getSupabase() {
    return getSupabaseClient();
  }

  async get_pm_frameworks(args: MCPToolArgs): Promise<FrameworkList> {
    try {
      let query = this.getSupabase()
        .from('frameworks')
        .select(`
          *,
          framework_steps (
            step_number,
            title,
            description
          )
        `)
        .order('success_rate', { ascending: false });

      if (args.category) {
        query = query.eq('category', args.category);
      }

      if (args.experience_level) {
        query = query.eq('difficulty_level', args.experience_level);
      }

      const { data: frameworks, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch frameworks: ${error.message}`);
      }

      const frameworkList: Framework[] = frameworks?.map((f: any) => ({
        id: f.id,
        name: f.name,
        category: f.category,
        description: f.description,
        difficulty_level: f.difficulty_level,
        estimated_time: f.estimated_time,
        success_rate: f.success_rate,
        usage_count: f.usage_count,
        is_premium: f.is_premium,
        created_at: f.created_at,
        updated_at: f.updated_at,
        steps: f.framework_steps,
      })) || [];

      return {
        available_frameworks: frameworkList,
        recommendation: this.getContextualRecommendation(frameworkList, args.context),
        total_count: frameworkList.length,
      };
    } catch (error) {
      throw new Error(`Failed to get PM frameworks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async start_framework_wizard(args: MCPToolArgs): Promise<WizardSession> {
    try {
      const { framework_name, project_context, stakeholders, timeline } = args;

      if (!framework_name || !project_context) {
        throw new Error('framework_name and project_context are required');
      }

      // Find framework by name or ID
      const { data: framework, error: frameworkError } = await this.getSupabase()
        .from('frameworks')
        .select('*')
        .or(`name.eq.${framework_name},id.eq.${framework_name}`)
        .single();

      if (frameworkError || !framework) {
        throw new Error(`Framework not found: ${framework_name}`);
      }

      // Create new session
      const { data: session, error: sessionError } = await this.getSupabase()
        .from('framework_sessions')
        .insert({
          user_id: this.getCurrentUserId(),
          framework_id: framework.id,
          session_data: {
            project_context,
            stakeholders,
            timeline,
          },
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`);
      }

      // Get first step
      const { data: firstStep, error: stepError } = await this.getSupabase()
        .from('framework_steps')
        .select('*')
        .eq('framework_id', framework.id)
        .eq('step_number', 1)
        .single();

      if (stepError || !firstStep) {
        throw new Error('Failed to get first step of framework');
      }

      // Get total step count
      const totalSteps = await this.getFrameworkStepCount(framework.id);

      // Personalize prompt
      const personalizedPrompt = this.personalizePrompt(
        firstStep.prompt_template,
        project_context,
        stakeholders
      );

      return {
        session_id: session.id,
        framework_name: framework.name,
        current_step: 1,
        total_steps: totalSteps,
        step_title: firstStep.title,
        step_description: firstStep.description,
        personalized_prompt: personalizedPrompt,
        input_type: firstStep.input_type,
        validation_rules: firstStep.validation_rules,
        progress_percentage: 0,
      };
    } catch (error) {
      throw new Error(`Failed to start framework wizard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async continue_framework_wizard(args: MCPToolArgs): Promise<WizardStep> {
    try {
      const { session_id, user_response, current_step } = args;

      if (!session_id || !user_response || current_step === undefined) {
        throw new Error('session_id, user_response, and current_step are required');
      }

      // Get session
      const { data: session, error: sessionError } = await this.getSupabase()
        .from('framework_sessions')
        .select('*')
        .eq('id', session_id)
        .single();

      if (sessionError || !session) {
        throw new Error('Framework session not found');
      }

      // Update session with user response
      const updatedSessionData = {
        ...session.session_data,
        [`step_${current_step}_response`]: user_response,
      };

      await this.getSupabase()
        .from('framework_sessions')
        .update({
          session_data: updatedSessionData,
          current_step: current_step + 1,
        })
        .eq('id', session_id);

      // Get next step or complete
      const nextStepNumber = current_step + 1;
      const { data: nextStep, error: stepError } = await this.getSupabase()
        .from('framework_steps')
        .select('*')
        .eq('framework_id', session.framework_id)
        .eq('step_number', nextStepNumber)
        .single();

      const totalSteps = await this.getFrameworkStepCount(session.framework_id);

      if (stepError || !nextStep) {
        // Framework completed
        await this.getSupabase()
          .from('framework_sessions')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq('id', session_id);

        return {
          session_id: session_id,
          step_number: current_step + 1,
          step_title: 'Framework Complete',
          step_description: 'You have successfully completed the framework!',
          personalized_prompt: 'Framework completed. Here are your results and next steps.',
          input_type: 'none',
          validation_rules: {},
          progress_percentage: 100,
          is_final_step: true,
        };
      }

      // Return next step
      const personalizedPrompt = this.personalizePrompt(
        nextStep.prompt_template,
        session.session_data.project_context,
        session.session_data.stakeholders
      );

      return {
        session_id: session_id,
        step_number: nextStepNumber,
        step_title: nextStep.title,
        step_description: nextStep.description,
        personalized_prompt: personalizedPrompt,
        input_type: nextStep.input_type,
        validation_rules: nextStep.validation_rules,
        progress_percentage: Math.round((nextStepNumber / totalSteps) * 100),
        is_final_step: nextStepNumber === totalSteps,
      };
    } catch (error) {
      throw new Error(`Failed to continue framework wizard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async get_optimized_prompts(args: MCPToolArgs): Promise<PromptList> {
    try {
      let query = this.getSupabase()
        .from('prompts')
        .select('*')
        .order('effectiveness_score', { ascending: false });

      if (args.task_type) {
        query = query.eq('task_type', args.task_type);
      }

      if (args.experience_level) {
        query = query.eq('category', args.experience_level);
      }

      const { data: prompts, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch prompts: ${error.message}`);
      }

      return {
        available_prompts: prompts || [],
        recommendation: this.getPromptRecommendation(prompts, args.context),
        total_count: prompts?.length || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get optimized prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async customize_prompt(args: MCPToolArgs): Promise<CustomizedPrompt> {
    try {
      const { prompt_id, variables, context } = args;

      if (!prompt_id || !variables) {
        throw new Error('prompt_id and variables are required');
      }

      // Get prompt
      const { data: prompt, error } = await this.getSupabase()
        .from('prompts')
        .select('*')
        .eq('id', prompt_id)
        .single();

      if (error || !prompt) {
        throw new Error('Prompt not found');
      }

      // Customize prompt template
      let customizedContent = prompt.prompt_template;
      
      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        customizedContent = customizedContent.replace(pattern, value);
      });

      // Add context if provided
      if (context) {
        customizedContent = `Context: ${context}\n\n${customizedContent}`;
      }

      return {
        prompt_id: prompt_id,
        customized_content: customizedContent,
        variables_used: variables,
        effectiveness_score: prompt.effectiveness_score,
      };
    } catch (error) {
      throw new Error(`Failed to customize prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getContextualRecommendation(frameworks: Framework[], context?: string): string {
    if (!context || frameworks.length === 0) {
      return 'Consider starting with our most popular framework based on success rates.';
    }

    // Simple keyword-based recommendation logic
    const lowerContext = context.toLowerCase();
    
    if (lowerContext.includes('priorit') || lowerContext.includes('feature')) {
      const prioritizationFrameworks = frameworks.filter(f => f.category === 'prioritization');
      if (prioritizationFrameworks.length > 0) {
        return `Based on your context, I recommend the ${prioritizationFrameworks[0].name} framework for prioritization decisions.`;
      }
    }
    
    if (lowerContext.includes('compet') || lowerContext.includes('market')) {
      const analysisFrameworks = frameworks.filter(f => f.category === 'analysis');
      if (analysisFrameworks.length > 0) {
        return `For competitive analysis, consider the ${analysisFrameworks[0].name} framework.`;
      }
    }

    return `Based on your needs, I recommend starting with ${frameworks[0].name} - it has a ${frameworks[0].success_rate * 100}% success rate.`;
  }

  private getPromptRecommendation(prompts: any[], context?: string): string {
    if (!prompts || prompts.length === 0) {
      return 'No prompts available for the specified criteria.';
    }

    return `I recommend starting with "${prompts[0].name}" - it has an effectiveness score of ${prompts[0].effectiveness_score}.`;
  }

  private personalizePrompt(template: string, context: string, stakeholders?: string[]): string {
    let personalized = template
      .replace(/\{\{project_context\}\}/g, context)
      .replace(/\{\{stakeholders\}\}/g, stakeholders?.join(', ') || 'your team')
      .replace(/\{\{company\}\}/g, this.getUserCompany() || 'your company');

    return personalized;
  }

  private async getFrameworkStepCount(frameworkId: string): Promise<number> {
    const { data, error } = await this.getSupabase()
      .from('framework_steps')
      .select('step_number')
      .eq('framework_id', frameworkId)
      .order('step_number', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 1;
    }

    return data[0].step_number;
  }

  private getCurrentUserId(): string {
    // For now, return a default user ID
    // This will be replaced with proper authentication
    return 'default-user';
  }

  private getUserCompany(): string {
    // Placeholder for user company info
    return 'your company';
  }
}