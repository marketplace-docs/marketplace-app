import {
  DollarSign,
  Package,
  Activity,
  CheckCircle,
} from 'lucide-react';
import { KpiCard } from './kpi-card';
import { TaskCompletionChart } from './task-completion-chart';
import { ResourceUtilizationChart } from './resource-utilization-chart';
import { RecentActivity } from './recent-activity';

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Revenue"
          value="$45,231.89"
          change="+20.1% from last month"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Inventory"
          value="12,234 units"
          change="+1.9% from last month"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Tasks Completed"
          value="+1,832"
          change="+180.1% from last month"
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <KpiCard
          title="Active Now"
          value="+573"
          change="Real-time staff activity"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <TaskCompletionChart />
        <ResourceUtilizationChart />
      </div>
      <RecentActivity />
    </div>
  );
}
