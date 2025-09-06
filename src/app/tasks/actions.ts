"use server";

import { prioritizeTasks } from "@/ai/flows/prioritize-tasks";
import type { PrioritizeTasksInput, PrioritizeTasksOutput } from "@/types";
import { z } from "zod";

const PrioritizeTasksInputSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    description: z.string(),
    deadline: z.string(),
    dependencies: z.array(z.string()),
    resourceRequirements: z.string(),
    priority: z.string().optional(),
  })),
});

export async function prioritizeTasksAction(
  input: PrioritizeTasksInput
): Promise<{ success: boolean; data?: PrioritizeTasksOutput, error?: string }> {
  const validatedInput = PrioritizeTasksInputSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, error: "Invalid input data." };
  }

  try {
    const output = await prioritizeTasks(validatedInput.data);

    const sortedOutput = output.sort((a, b) => {
        const priorityOrder = { 'Highest': 5, 'High': 4, 'Medium': 3, 'Low': 2, 'Lowest': 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    });

    return { success: true, data: sortedOutput };
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    return { success: false, error: "An unexpected error occurred while prioritizing tasks." };
  }
}
