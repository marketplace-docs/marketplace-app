
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo, CheckSquare, Palette, Users } from "lucide-react";

const techStack = ["Next.js", "React", "TypeScript", "Tailwind CSS", "ShadCN UI", "Genkit", "Firebase"];

export default function AppSettingsPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">App Documentation</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Market Place</CardTitle>
                        <CardDescription>An integrated platform for warehouse optimization and task management.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Core Features</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-start gap-3">
                                    <ListTodo className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Task Prioritization:</span> Uses AI to prioritize tasks based on deadlines, dependencies, and resource availability.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <CheckSquare className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">Real-time Task Assignment:</span> Dynamically assigns tasks to warehouse staff based on workload and skill set.</span>
                                </li>
                                 <li className="flex items-start gap-3">
                                    <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                    <span><span className="font-semibold">User Authentication:</span> Secure user authentication system to manage user profiles and access rights.</span>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">Style Guidelines</h3>
                            <ul className="space-y-3 text-sm">
                                <li className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#3F51B5' }} />
                                    <span><span className="font-semibold">Primary Color:</span> Strong blue (#3F51B5) for trust and efficiency.</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#EEEEEE', border: '1px solid #ccc' }} />
                                    <span><span className="font-semibold">Background Color:</span> Light gray (#EEEEEE) for a clean, professional look.</span>
                                </li>
                                 <li className="flex items-center gap-3">
                                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#9FA8DA' }} />
                                    <span><span className="font-semibold">Accent Color:</span> Soft violet (#9FA8DA) for a touch of sophistication.</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Palette className="h-4 w-4 text-primary flex-shrink-0" />
                                    <span><span className="font-semibold">Font:</span> 'PT Sans' for a modern yet warm feel.</span>
                                </li>
                            </ul>
                        </div>
                         <div>
                            <h3 className="font-semibold text-lg mb-2">Tech Stack</h3>
                            <div className="flex flex-wrap gap-2">
                                {techStack.map(tech => (
                                    <Badge key={tech} variant="secondary">{tech}</Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
