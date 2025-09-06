export type ChartConfig = {
    [k in string]: {
      label?: React.ReactNode;
      icon?: React.ComponentType;
    } & (
      | { color?: string; theme?: never }
      | { color?: never; theme: Record<string, string> }
    )
  };

export const taskCompletionData = [
  { date: 'Week 1', completed: 186, pending: 80 },
  { date: 'Week 2', completed: 305, pending: 200 },
  { date: 'Week 3', completed: 237, pending: 120 },
  { date: 'Week 4', completed: 73, pending: 190 },
  { date: 'Week 5', completed: 209, pending: 130 },
  { date: 'Week 6', completed: 214, pending: 140 },
];

export const resourceUtilizationData = [
    { resource: 'staff', utilization: 275, fill: 'var(--color-staff)' },
    { resource: 'equipment', utilization: 200, fill: 'var(--color-equipment)' },
    { resource: 'space', utilization: 187, fill: 'var(--color-space)' },
];

export const recentActivities = [
    { id: '1', user: 'John Doe', taskId: 'TSK-001', status: 'Completed', timestamp: '5m ago' },
    { id: '2', user: 'Jane Smith', taskId: 'TSK-002', status: 'In Progress', timestamp: '10m ago' },
    { id: '3', user: 'Robert Brown', taskId: 'TSK-003', status: 'Assigned', timestamp: '1h ago' },
    { id: '4', user: 'Emily White', taskId: 'TSK-004', status: 'Completed', timestamp: '2h ago' },
    { id: '5', user: 'Michael Green', taskId: 'TSK-005', status: 'On Hold', timestamp: '3h ago' },
];

export const initialTasksForPrioritization = [
    { id: '1', description: 'Process incoming shipment A', deadline: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], dependencies: '', resourceRequirements: 'Forklift, 2 staff' },
    { id: '2', description: 'Pack customer order #1234', deadline: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], dependencies: '3', resourceRequirements: 'Packing station 1' },
    { id: '3', description: 'Pick items for order #1234', deadline: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], dependencies: '', resourceRequirements: '1 staff' },
    { id: '4', description: 'Annual inventory stock count', deadline: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], dependencies: '1', resourceRequirements: '5 staff, all scanning devices' },
];
