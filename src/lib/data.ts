

export type ChartConfig = {
    [k in string]: {
      label?: React.ReactNode;
      icon?: React.ComponentType;
    } & (
      | { color?: string; theme?: never }
      | { color?: never; theme: Record<string, string> }
    )
  };

export const taskCompletionData: { date: string; completed: number; pending: number; }[] = [];

export const resourceUtilizationData: { resource: string; utilization: number; fill: string; }[] = [];

export const recentActivities: { id: string; user: string; taskId: string; status: string; timestamp: string; }[] = [];

export const initialTasksForPrioritization: { id: string; description: string; deadline: string; dependencies: string; resourceRequirements: string; }[] = [];

type Store = {
  id: number;
  marketplace: string;
  storeName: string;
  nameStore: string;
};

export const initialStores: Store[] = [];
