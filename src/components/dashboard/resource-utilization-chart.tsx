'use client';

import { TrendingUp } from 'lucide-react';
import {
  Pie,
  PieChart,
  Cell,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { resourceUtilizationData, type ChartConfig } from '@/lib/data';

const chartConfig = {
  utilization: {
    label: 'Utilization',
  },
  staff: {
    label: 'Staff',
    color: 'hsl(var(--chart-1))',
  },
  equipment: {
    label: 'Equipment',
    color: 'hsl(var(--chart-2))',
  },
  space: {
    label: 'Space',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function ResourceUtilizationChart() {
  return (
    <Card className="flex flex-col lg:col-span-3">
      <CardHeader className="items-center pb-0">
        <CardTitle>Resource Utilization</CardTitle>
        <CardDescription>Current vs. Last Month</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={resourceUtilizationData}
              dataKey="utilization"
              nameKey="resource"
              innerRadius={60}
              strokeWidth={5}
            >
                {resourceUtilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartConfig[entry.resource as keyof typeof chartConfig]?.color} />
                ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing total resource utilization for the current month
        </div>
      </CardFooter>
    </Card>
  );
}
