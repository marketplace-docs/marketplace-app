
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import type { AdminTask } from '@/types/admin-task';
import { Upload, Download, Search } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function CreateTaskPage() {
  const [tasks, setTasks] = useLocalStorage<AdminTask[]>('adminTasks', []);
  const [newTask, setNewTask] = React.useState({
    name: '',
    job: '',
    shift: '',
  });
  const { toast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setNewTask(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.name || !newTask.job || !newTask.shift) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }

    const newId = tasks.length > 0 ? String(Math.max(...tasks.map(t => parseInt(t.id))) + 1) : '1';
    const taskToAdd: AdminTask = {
      id: newId,
      name: newTask.name,
      job: newTask.job,
      status: newTask.shift === 'Hadir' ? 'Hadir' : 'Absen', // Example logic
      category: newTask.shift,
      date: new Date().toISOString().split('T')[0],
    };

    setTasks([...tasks, taskToAdd]);
    toast({
      title: 'Success',
      description: 'New task has been created.',
    });
    // Reset form
    setNewTask({ name: '', job: '', shift: '' });
  };

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">Admin Task</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create Task</CardTitle>
            <CardDescription>
              Fill out the form below to create a new task.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter name"
                    value={newTask.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job">Job</Label>
                  <Select name="job" value={newTask.job} onValueChange={(value) => handleSelectChange('job', value)}>
                    <SelectTrigger id="job">
                      <SelectValue placeholder="Select Job" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Leader">Leader</SelectItem>
                      <SelectItem value="Putaway">Putaway</SelectItem>
                      <SelectItem value="Picker">Picker</SelectItem>
                      <SelectItem value="Packer">Packer</SelectItem>
                      <SelectItem value="Interco Transferan">Interco Transferan</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift">Shift</Label>
                  <Select name="shift" value={newTask.shift} onValueChange={(value) => handleSelectChange('shift', value)}>
                    <SelectTrigger id="shift">
                      <SelectValue placeholder="Select Shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pagi">Pagi</SelectItem>
                      <SelectItem value="Siang">Siang</SelectItem>
                      <SelectItem value="Sore">Sore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-4 space-x-2">
                 <Button variant="outline" type="button">
                    <Upload className="mr-2 h-4 w-4" /> Import
                </Button>
                <Button variant="outline" type="button">
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button variant="outline" type="button">
                    <Search className="mr-2 h-4 w-4" /> Upload
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
