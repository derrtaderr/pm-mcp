#!/usr/bin/env node

import 'dotenv/config';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { AIPMToolkitServer } from './services/ai-pm-toolkit-server.js';
import { initializeSupabase } from './lib/supabase.js';

const AI_PM_TOOLKIT_VERSION = '1.0.0';

class MCPServer {
  private server: Server;
  private aipmServer: AIPMToolkitServer;

  constructor() {
    this.server = new Server(
      {
        name: 'ai-pm-toolkit',
        version: AI_PM_TOOLKIT_VERSION,
      }
    );

    this.aipmServer = new AIPMToolkitServer();
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_pm_frameworks',
            description: 'Get available PM frameworks filtered by category and experience level',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  enum: ['prioritization', 'research', 'strategy', 'analysis'],
                  description: 'Framework category to filter by',
                },
                experience_level: {
                  type: 'string',
                  enum: ['beginner', 'intermediate', 'advanced'],
                  description: 'User experience level',
                },
                context: {
                  type: 'string',
                  description: 'Project context for personalized recommendations',
                },
              },
            },
          },
          {
            name: 'start_framework_wizard',
            description: 'Start an interactive framework wizard session',
            inputSchema: {
              type: 'object',
              properties: {
                framework_name: {
                  type: 'string',
                  description: 'Name or ID of the framework to start',
                },
                project_context: {
                  type: 'string',
                  description: 'Context about the project or situation',
                },
                stakeholders: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of stakeholders involved',
                },
                timeline: {
                  type: 'string',
                  description: 'Project timeline or deadline',
                },
              },
              required: ['framework_name', 'project_context'],
            },
          },
          {
            name: 'continue_framework_wizard',
            description: 'Continue with the next step in framework wizard',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'Active wizard session ID',
                },
                user_response: {
                  type: 'string',
                  description: 'User response to current step',
                },
                current_step: {
                  type: 'number',
                  description: 'Current step number',
                },
              },
              required: ['session_id', 'user_response', 'current_step'],
            },
          },
          {
            name: 'get_optimized_prompts',
            description: 'Get optimized prompts for specific PM tasks',
            inputSchema: {
              type: 'object',
              properties: {
                task_type: {
                  type: 'string',
                  description: 'Type of PM task (e.g., prioritization, analysis)',
                },
                experience_level: {
                  type: 'string',
                  enum: ['beginner', 'intermediate', 'advanced'],
                  description: 'User experience level',
                },
                context: {
                  type: 'string',
                  description: 'Specific context for prompt customization',
                },
              },
              required: ['task_type'],
            },
          },
          {
            name: 'customize_prompt',
            description: 'Customize a prompt with specific variables and context',
            inputSchema: {
              type: 'object',
              properties: {
                prompt_id: {
                  type: 'string',
                  description: 'ID of the prompt to customize',
                },
                variables: {
                  type: 'object',
                  description: 'Variables to substitute in the prompt template',
                },
                context: {
                  type: 'string',
                  description: 'Additional context for customization',
                },
              },
              required: ['prompt_id', 'variables'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_pm_frameworks':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.aipmServer.get_pm_frameworks(args || {}), null, 2),
                },
              ],
            };

          case 'start_framework_wizard':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.aipmServer.start_framework_wizard(args || {}), null, 2),
                },
              ],
            };

          case 'continue_framework_wizard':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.aipmServer.continue_framework_wizard(args || {}), null, 2),
                },
              ],
            };

          case 'get_optimized_prompts':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.aipmServer.get_optimized_prompts(args || {}), null, 2),
                },
              ],
            };

          case 'customize_prompt':
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(await this.aipmServer.customize_prompt(args || {}), null, 2),
                },
              ],
            };

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
      }
    });
  }

  async start() {
    // Initialize Supabase connection
    await initializeSupabase();
    
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('AI PM Toolkit MCP Server started successfully');
  }
}

async function main() {
  const server = new MCPServer();
  await server.start();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { MCPServer };