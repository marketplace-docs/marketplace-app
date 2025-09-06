import { z } from 'zod';

const TaskSchema = z.object({
  id: z.string(),
  description: z.string(),
  deadline: z.string(),
  dependencies: z.array(z.string()),
  resourceRequirements: z.string(),
  priority: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

const TaskWithPrioritySchema = TaskSchema.extend({
    priority: z.string(),
});

export type TaskWithPriority = z.infer<typeof TaskWithPrioritySchema>;

const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(TaskSchema),
});

export type PrioritizeTasksInput = z.infer<typeof PrioritizeTasksInputSchema>;

export type PrioritizeTasksOutput = TaskWithPriority[];
