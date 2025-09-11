
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
import { Upload, Download } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';

export default function CreateTaskPage() {
  const [tasks, setTasks] = useLocalStorage<AdminTask[]>('adminTasks', []);
  const [newTask, setNewTask] = React.useState({
    name: '',
    job: '',
    shift: '',
    status: '',
  });
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setNewTask(prev => ({ ...prev, [name]: value }));
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.name || !newTask.job || !newTask.shift || !newTask.status) {
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
      shift: newTask.shift,
      status: newTask.status,
      date: new Date().toISOString(),
    };

    setTasks([...tasks, taskToAdd]);
    toast({
      title: 'Success',
      description: 'New task has been created.',
    });
    // Reset form
    setNewTask({ name: '', job: '', shift: '', status: '' });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const newTasks: AdminTask[] = [];
            let maxId = tasks.length > 0 ? Math.max(...tasks.map(s => parseInt(s.id))) : 0;
            
            lines.forEach((line, index) => {
              if (index === 0 && line.toLowerCase().includes('name,job,shift,status')) return; // Skip header

              const [name, job, shift, status] = line.split(',').map(s => s.trim());

              if (name && job && shift && status) {
                  newTasks.push({
                      id: String(++maxId),
                      name,
                      job,
                      shift,
                      status,
                      date: new Date().toISOString()
                  });
              } else if (line.trim()) { // Only throw error for non-empty invalid lines
                 throw new Error(`Invalid CSV format on line ${index + 1}: ${line}`);
              }
            });

            setTasks(prevTasks => [...prevTasks, ...newTasks]);
            toast({
                title: "Success",
                description: `${newTasks.length} tasks uploaded successfully.`,
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error.message || "An error occurred while parsing the CSV file.",
            });
        }
    };
    reader.readAsText(file);
    // Reset file input
    if (event.target) {
        event.target.value = '';
    }
  };

  const handleExport = () => {
    const headers = ["Name", "Job", "Shift", "Status"];
    
    // For template, we can just export headers. If there is data, we export data.
    const rows = tasks.length > 0
      ? tasks.map(t => [t.name, t.job, t.shift, t.status].join(","))
      : [];
    
    const csvContent = [
        headers.join(","),
        ...rows
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Success",
      description: "Tasks exported as CSV.",
    });
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" value={newTask.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Event">Event</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-4 space-x-2">
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                 <Button variant="outline" type="button" onClick={handleUploadClick}>
                    <Upload className="mr-2 h-4 w-4" /> Upload
                </Button>
                <Button variant="outline" type="button" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export
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
