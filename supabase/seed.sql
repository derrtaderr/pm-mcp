-- Seed data for AI PM MCP
-- Insert initial frameworks, steps, and prompts

-- Insert Core Frameworks
INSERT INTO frameworks (name, category, description, difficulty_level, estimated_time, success_rate, is_premium) VALUES
('RICE Prioritization', 'prioritization', 'A framework for prioritizing features based on Reach, Impact, Confidence, and Effort', 'intermediate', 30, 0.92, false),
('Competitive Analysis', 'analysis', 'Systematic framework for analyzing competitors and market positioning', 'intermediate', 45, 0.88, false),
('User Research Synthesis', 'research', 'Framework for synthesizing user research into actionable insights', 'advanced', 60, 0.85, false),
('PRD Creation', 'strategy', 'Step-by-step guide for creating comprehensive Product Requirements Documents', 'beginner', 90, 0.90, false),
('Feature Evaluation', 'analysis', 'Framework for evaluating feature impact vs implementation effort', 'beginner', 25, 0.94, false);

-- Get framework IDs for step insertion
DO $$
DECLARE
    rice_id UUID;
    comp_analysis_id UUID;
    user_research_id UUID;
    prd_creation_id UUID;
    feature_eval_id UUID;
BEGIN
    SELECT id INTO rice_id FROM frameworks WHERE name = 'RICE Prioritization';
    SELECT id INTO comp_analysis_id FROM frameworks WHERE name = 'Competitive Analysis';
    SELECT id INTO user_research_id FROM frameworks WHERE name = 'User Research Synthesis';
    SELECT id INTO prd_creation_id FROM frameworks WHERE name = 'PRD Creation';
    SELECT id INTO feature_eval_id FROM frameworks WHERE name = 'Feature Evaluation';

    -- RICE Prioritization Steps
    INSERT INTO framework_steps (framework_id, step_number, title, description, prompt_template, input_type, validation_rules) VALUES
    (rice_id, 1, 'Define Features', 'List all features you need to prioritize', 'List the features you need to prioritize for {{project_context}}. For each feature, provide: 1) Feature name, 2) Brief description, 3) Target user segment. Please format as a numbered list.', 'text', '{"min_length": 50}'),
    (rice_id, 2, 'Score Reach', 'Estimate how many users each feature will reach per time period', 'For each feature, estimate the REACH score (1-10): How many users will be affected by this feature in the next quarter? Use this scale: 1-2 = <100 users, 3-4 = 100-500 users, 5-6 = 500-2000 users, 7-8 = 2000-10000 users, 9-10 = >10000 users. Consider your current user base of {{company}} and provide scores for each feature.', 'text', '{"requires_numbers": true}'),
    (rice_id, 3, 'Score Impact', 'Rate the impact each feature will have on your key metric', 'Rate the IMPACT score (1-10) for each feature: How much will this feature improve your key metric when a user encounters it? Use this scale: 1-2 = Minimal impact, 3-4 = Low impact, 5-6 = Medium impact, 7-8 = High impact, 9-10 = Massive impact. Consider your primary success metric for {{project_context}}.', 'text', '{"requires_numbers": true}'),
    (rice_id, 4, 'Score Confidence', 'Rate your confidence in the Reach and Impact estimates', 'Rate your CONFIDENCE score (0.5-10) for each feature: How confident are you in your Reach and Impact estimates? Use this scale: 0.5-2 = Very uncertain, 3-4 = Somewhat uncertain, 5-6 = Neutral, 7-8 = Confident, 9-10 = Very confident. Base this on available data, user feedback, and market research.', 'text', '{"requires_numbers": true}'),
    (rice_id, 5, 'Score Effort', 'Estimate the person-months of work required', 'Estimate the EFFORT score for each feature in person-months: How much development time will this feature require? Consider: Frontend work, Backend work, Design time, Testing, Documentation. Provide effort estimates for each feature considering your team of {{stakeholders}}.', 'text', '{"requires_numbers": true}'),
    (rice_id, 6, 'Calculate RICE Scores', 'Review calculated RICE scores and prioritized list', 'Based on your scores, here are the calculated RICE priorities: (Reach × Impact × Confidence) ÷ Effort. Review these results and provide any final adjustments or insights about the prioritization. Consider: Are there any surprises? Do the rankings align with your intuition? Any features that should be grouped together?', 'text', '{}');

    -- Competitive Analysis Steps
    INSERT INTO framework_steps (framework_id, step_number, title, description, prompt_template, input_type, validation_rules) VALUES
    (comp_analysis_id, 1, 'Identify Competitors', 'List direct and indirect competitors', 'Identify the main competitors for {{project_context}}. Include: 1) Direct competitors (solving the same problem), 2) Indirect competitors (alternative solutions), 3) Substitute products. For each competitor, note their company size and market position.', 'text', '{"min_competitors": 3}'),
    (comp_analysis_id, 2, 'Feature Comparison', 'Compare key features across competitors', 'Create a feature comparison matrix. List the key features/capabilities that matter for {{project_context}} and rate each competitor (including your company) on a scale of 1-5 for each feature. Consider: Core functionality, User experience, Integrations, Pricing model, Customer support.', 'text', '{}'),
    (comp_analysis_id, 3, 'Positioning Analysis', 'Analyze market positioning and messaging', 'Analyze how each competitor positions themselves in the market. For each competitor, identify: 1) Target customer segment, 2) Key value proposition, 3) Main marketing messages, 4) Pricing strategy. How does this compare to your positioning for {{project_context}}?', 'text', '{}'),
    (comp_analysis_id, 4, 'Strengths & Weaknesses', 'Identify competitive advantages and gaps', 'For each competitor (including your company), identify: STRENGTHS: What do they do exceptionally well? WEAKNESSES: Where do they fall short? OPPORTUNITIES: What gaps could you exploit? THREATS: Where might they outcompete you? Focus on implications for {{project_context}}.', 'text', '{}'),
    (comp_analysis_id, 5, 'Strategic Recommendations', 'Develop competitive strategy recommendations', 'Based on your analysis, provide strategic recommendations for {{project_context}}: 1) How should you differentiate? 2) Which competitor weaknesses can you exploit? 3) What features/capabilities should you prioritize? 4) How should you adjust your positioning? 5) What competitive threats need immediate attention?', 'text', '{}');

    -- Feature Evaluation Steps (simplified for brevity)
    INSERT INTO framework_steps (framework_id, step_number, title, description, prompt_template, input_type, validation_rules) VALUES
    (feature_eval_id, 1, 'Feature Description', 'Describe the feature in detail', 'Provide a detailed description of the feature you want to evaluate for {{project_context}}: 1) What does the feature do? 2) Who is the target user? 3) What problem does it solve? 4) How does the user interact with it? 5) What is the expected outcome?', 'text', '{}'),
    (feature_eval_id, 2, 'Impact Assessment', 'Evaluate potential business and user impact', 'Assess the potential impact of this feature for {{project_context}}: USER IMPACT: How will this improve the user experience? BUSINESS IMPACT: How will this affect key metrics? Rate each area 1-10 and provide reasoning.', 'text', '{}'),
    (feature_eval_id, 3, 'Effort Estimation', 'Estimate implementation effort and resources', 'Estimate the effort required to build this feature for {{project_context}}: DEVELOPMENT TIME: Engineering effort in person-weeks, DESIGN TIME: UX/UI design effort, TECHNICAL COMPLEXITY: Rate 1-5 and explain challenges. Consider your team: {{stakeholders}}.', 'text', '{}'),
    (feature_eval_id, 4, 'Final Recommendation', 'Make a build/don\'t build recommendation', 'Based on your analysis, make a recommendation for {{project_context}}: DECISION: Build, Don\'t Build, or Build Later? REASONING: Key factors driving your decision, NEXT STEPS: Immediate actions required. Summarize the impact vs effort trade-off clearly.', 'text', '{}');
END $$;

-- Insert Core Prompts
INSERT INTO prompts (name, category, task_type, prompt_template, variables, engineering_pattern, effectiveness_score, is_premium) VALUES
('RICE Prioritization Prompt', 'prioritization', 'feature_prioritization', 'You are a senior product manager helping prioritize features using the RICE framework. Context: {{context}} Features to evaluate: {{features}} For each feature, provide scores for: - Reach (1-10): How many users affected per quarter - Impact (1-10): Improvement to key metric when users encounter it - Confidence (0.5-10): Confidence in reach/impact estimates - Effort (person-months): Development time required Calculate RICE score as (Reach × Impact × Confidence) ÷ Effort and rank features. Provide reasoning for each score and highlight any assumptions.', '{"context": "", "features": ""}', 'Context-Instruction-Output', 0.92, false),

('Competitive Analysis Prompt', 'analysis', 'competitive_research', 'As a market research analyst, conduct a comprehensive competitive analysis. Context: {{context}} Competitors: {{competitors}} Create a detailed analysis including: 1. Feature comparison matrix with 1-5 ratings 2. Market positioning and messaging analysis 3. Pricing strategy comparison 4. Strengths and weaknesses for each competitor 5. Strategic recommendations for differentiation Provide specific, actionable insights backed by evidence.', '{"context": "", "competitors": ""}', 'RTF', 0.88, false),

('User Research Synthesis Prompt', 'research', 'user_research', 'You are a UX researcher synthesizing user research findings. Research data: {{research_data}} Synthesis requirements: {{output_format}} Extract key insights by: 1. Identifying recurring themes and patterns 2. Grouping related findings 3. Quantifying frequency of mentions 4. Assessing confidence levels 5. Translating insights into actionable recommendations Present findings with supporting quotes and evidence. Prioritize insights by impact and confidence.', '{"research_data": "", "output_format": "themes"}', 'TAG', 0.85, false),

('PRD Executive Summary Prompt', 'documentation', 'prd_writing', 'Write a compelling executive summary for a PRD. Product: {{product_name}} Problem: {{problem_statement}} Solution: {{solution_overview}} Target users: {{target_users}} Success metrics: {{success_metrics}} Create a concise executive summary that: 1. Hooks the reader with the problem/opportunity 2. Clearly articulates the solution value 3. Defines success criteria 4. Builds confidence in the approach Use clear, executive-friendly language. Length: 2-3 paragraphs maximum.', '{"product_name": "", "problem_statement": "", "solution_overview": "", "target_users": "", "success_metrics": ""}', 'Context-Instruction-Output', 0.90, false),

('Feature Impact vs Effort Prompt', 'analysis', 'feature_evaluation', 'Evaluate this feature using impact vs effort analysis. Feature description: {{feature_description}} Business context: {{business_context}} Team constraints: {{team_constraints}} Assess: IMPACT (1-10): - User experience improvement - Business metric impact - Strategic value - Market differentiation EFFORT (1-10): - Development complexity - Design requirements - Testing needs - Resource availability Provide: Final impact/effort scores, recommendation (High/Medium/Low priority), key assumptions, success criteria, and risk factors.', '{"feature_description": "", "business_context": "", "team_constraints": ""}', 'RTF', 0.94, false);

-- Update framework and prompt usage counts to simulate real usage
UPDATE frameworks SET usage_count = floor(random() * 100) + 10;
UPDATE prompts SET usage_count = floor(random() * 50) + 5;