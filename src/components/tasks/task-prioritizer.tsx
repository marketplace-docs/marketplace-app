"use client";

import { useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { PlusCircle, Trash2, Wand2, Loader2 } from "lucide-react";
import { prioritizeTasksAction } from "@/app/tasks/actions";
import type { TaskWithPriority, PrioritizeTasksInput } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { useToast } from "@/hooks/use-toast";
import { initialTasksForPrioritization } from "@/lib/data";

const taskSchema = z.object({
  id: z.string().min(1, "ID is required."),
  description: z.string().min(1, "Description is required."),
  deadline: z.string().min(1, "Deadline is required."),
  dependencies: z.string().optional(),
  resourceRequirements: z.string().min(1, "Resource requirements are required."),
});

const formSchema = z.object({
  tasks: z.array(taskSchema),
});

type FormData = z.infer<typeof formSchema>;

export function TaskPrioritizer() {
  const [isPending, startTransition] = useTransition();
  const [prioritizedTasks, setPrioritizedTasks] = useState<TaskWithPriority[]>([]);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tasks: initialTasksForPrioritization,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      const input: PrioritizeTasksInput = {
        tasks: data.tasks.map(task => ({
          ...task,
          dependencies: task.dependencies ? task.dependencies.split(',').map(d => d.trim()) : [],
        }))
      };
      const result = await prioritizeTasksAction(input);
      if (result.success && result.data) {
        setPrioritizedTasks(result.data);
        toast({
          title: "Success",
          description: "Tasks have been prioritized by AI.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      }
    });
  };

  const priorityColorMap: { [key: string]: string } = {
    'Highest': 'bg-red-600',
    'High': 'bg-orange-500',
    'Medium': 'bg-yellow-500',
    'Low': 'bg-green-500',
    'Lowest': 'bg-blue-500',
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Manage Tasks</CardTitle>
          <CardDescription>Add, edit, or remove tasks before AI prioritization.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                    <FormField
                      control={form.control}
                      name={`tasks.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the task..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FormField
                        control={form.control}
                        name={`tasks.${index}.deadline`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deadline</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={form.control}
                        name={`tasks.${index}.dependencies`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dependencies (IDs)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 2, 3" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`tasks.${index}.resourceRequirements`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resource Requirements</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Forklift, 2 staff" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                 <Button type="button" variant="outline" onClick={() => append({ id: (fields.length + 1).toString(), description: '', deadline: '', dependencies: '', resourceRequirements: '' })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  Prioritize with AI
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Prioritized Task List</CardTitle>
          <CardDescription>AI-generated priority order for your tasks.</CardDescription>
        </CardHeader>
        <CardContent>
          {isPending && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">AI is thinking...</p>
            </div>
          )}
          {!isPending && prioritizedTasks.length === 0 && (
            <div className="text-center text-muted-foreground py-16">
              <p>Your prioritized tasks will appear here.</p>
            </div>
          )}
          {!isPending && prioritizedTasks.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Priority</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prioritizedTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Badge className={`${priorityColorMap[task.priority] || 'bg-gray-400'} text-white hover:${priorityColorMap[task.priority] || 'bg-gray-400'}`}>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{task.description}</TableCell>
                    <TableCell>{new Date(task.deadline).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
