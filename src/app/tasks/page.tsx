import { TaskPrioritizer } from "@/components/tasks/task-prioritizer";

export default function TasksPage() {
    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Task Prioritization</h1>
                <p className="text-muted-foreground">Use AI to prioritize tasks based on deadlines, dependencies, and resources.</p>
            </div>
            <TaskPrioritizer />
        </div>
    )
}
