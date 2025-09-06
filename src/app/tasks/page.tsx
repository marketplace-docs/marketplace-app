
'use client';

import { TaskPrioritizer } from "@/components/tasks/task-prioritizer";
import { MainLayout } from "@/components/layout/main-layout";

export default function TasksPage() {
    return (
        <MainLayout>
             <div className="w-full max-w-7xl">
                <h1 className="text-3xl font-bold mb-6">Task Prioritization</h1>
                <TaskPrioritizer />
            </div>
        </MainLayout>
    );
}
