// Prioritize tasks based on deadlines, dependencies, and resource availability using AI.

'use server';

/**
 * @fileOverview This file defines a Genkit flow for prioritizing tasks using AI.
 *
 * - prioritizeTasks - A function that prioritizes a list of tasks based on their deadlines, dependencies,
 *   and resource availability.
 * - PrioritizeTasksInput - The input type for the prioritizeTasks function.
 * - PrioritizeTasksOutput - The output type for the prioritizeTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TaskSchema = z.object({
  id: z.string().describe('Unique identifier for the task.'),
  description: z.string().describe('Description of the task.'),
  deadline: z.string().describe('The deadline for the task (ISO format).'),
  dependencies: z.array(z.string()).describe('List of task IDs that must be completed before this task.'),
  resourceRequirements: z.string().describe('Resources needed for the task (e.g., specific equipment or personnel).'),
  priority: z.string().optional().describe('The priority of the task. If not provided, AI will determine it.'),
});

export type Task = z.infer<typeof TaskSchema>;

const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(TaskSchema).describe('List of tasks to prioritize.'),
});

export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

const PrioritizeTasksOutputSchema = z.array(
  TaskSchema.extend({
    priority: z.string().describe('The priority of the task as determined by AI.'),
  })
);

export type PrioritizeTasksOutput = z.infer<typeof PrioritizeTasksOutputSchema>;

export async function prioritizeTasks(input: PrioritizeTasksInput): Promise<PrioritizeTasksOutput> {
  return prioritizeTasksFlow(input);
}

const prioritizeTasksPrompt = ai.definePrompt({
  name: 'prioritizeTasksPrompt',
  input: {schema: PrioritizeTasksInputSchema},
  output: {schema: PrioritizeTasksOutputSchema},
  prompt: `You are an AI task prioritization expert. Given the following list of tasks, 
your goal is to determine the appropriate priority for each task. 
Consider the deadline, dependencies, and resource requirements of each task. 
Ensure that tasks with earlier deadlines, critical dependencies, and limited resource availability are given higher priority.

Tasks:
{{#each tasks}}
  - ID: {{this.id}}
    Description: {{this.description}}
    Deadline: {{this.deadline}}
    Dependencies: {{this.dependencies}}
    Resource Requirements: {{this.resourceRequirements}}
    Priority: {{this.priority}}
{{/each}}

Prioritized Tasks (include all original task details):
`,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const prioritizeTasksFlow = ai.defineFlow(
  {
    name: 'prioritizeTasksFlow',
    inputSchema: PrioritizeTasksInputSchema,
    outputSchema: PrioritizeTasksOutputSchema,
  },
  async input => {
    const {output} = await prioritizeTasksPrompt(input);
    return output!;
  }
);
