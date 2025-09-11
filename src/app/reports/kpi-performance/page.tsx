
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

type Kpi = {
  name: string;
  value: number;
  target: number;
  unit: string;
};

const kpiData: Kpi[] = [
  { name: "Inventory Accuracy", value: 98.5, target: 99.5, unit: "%" },
  { name: "Order Processing Speed", value: 3.2, target: 2.5, unit: " hours" },
  { name: "Return Rate", value: 2.1, target: 3.0, unit: "%" },
  { name: "Putaway Accuracy", value: 99.2, target: 99.0, unit: "%" },
  { name: "Order Picking Accuracy", value: 99.8, target: 99.5, unit: "%" },
];

const KpiCard = ({ kpi }: { kpi: Kpi }) => {
    const isMeetingTarget = kpi.name === "Return Rate" 
        ? kpi.value <= kpi.target 
        : kpi.value >= kpi.target;
    
    const progressValue = Math.min((kpi.value / kpi.target) * 100, 100);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">{kpi.name}</CardTitle>
                {isMeetingTarget ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                )}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{kpi.value}{kpi.unit}</div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Target className="h-4 w-4 mr-1" />
                    <span>Target: {kpi.target}{kpi.unit}</span>
                </div>
                <Progress value={progressValue} className="mt-4 h-2" />
            </CardContent>
        </Card>
    );
}

export default function KpiPerformancePage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">KPI Performance</h1>
                 <Card>
                    <CardHeader>
                        <CardTitle>Key Performance Indicators</CardTitle>
                        <CardDescription>
                            An overview of the main performance metrics against targets.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {kpiData.map(kpi => (
                            <KpiCard key={kpi.name} kpi={kpi} />
                        ))}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
