

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

type Store = {
  id: number;
  marketplace: string;
  storeName: string;
  nameStore: string;
};

export const initialStores: Store[] = [
  { id: 1, marketplace: 'Shopee', storeName: 'Jung Saem Mool Official Store', nameStore: 'Shopee Jung Saem Mool' },
  { id: 2, marketplace: 'Shopee', storeName: 'Amuse Official Store', nameStore: 'Shopee Amuse' },
  { id: 3, marketplace: 'Shopee', storeName: 'Carasun.id Official Store', nameStore: 'Shopee Carasun' },
  { id: 4, marketplace: 'Shopee', storeName: 'Ariul Official Store', nameStore: 'Shopee Ariul' },
  { id: 5, marketplace: 'Shopee', storeName: 'Dr G Official Store', nameStore: 'Shopee Dr G' },
  { id: 6, marketplace: 'Shopee', storeName: 'Im From Official Store', nameStore: 'Shopee Im From' },
  { id: 7, marketplace: 'Shopee', storeName: 'COSRX Official Store', nameStore: 'Shopee COSRX' },
  { id: 8, marketplace: 'Shopee', storeName: 'Espoir Official Store', nameStore: 'Shopee Espoir' },
  { id: 9, marketplace: 'Shopee', storeName: 'Mediheal Official Store', nameStore: 'Shopee Mediheal' },
  { id: 10, marketplace: 'Shopee', storeName: 'Keana Official Store', nameStore: 'Shopee Keana' },
  { id: 11, marketplace: 'Shopee', storeName: 'Lilla Baby Indonesia', nameStore: 'Shopee Lilla Baby' },
  { id: 12, marketplace: 'Shopee', storeName: 'Lilla Official store', nameStore: 'Shopee lilla' },
  { id: 13, marketplace: 'Shopee', storeName: 'Edit by Sociolla', nameStore: 'Shopee' },
  { id: 14, marketplace: 'Shopee', storeName: 'Round Lab Official Store', nameStore: 'Shopee Round Lab' },
  { id: 15, marketplace: 'Shopee', storeName: 'Speak To Me Official Store', nameStore: 'Shopee Speak to me' },
  { id: 16, marketplace: 'Shopee', storeName: 'Sukin Official Store', nameStore: 'Shopee Sukin' },
  { id: 17, marketplace: 'Shopee', storeName: 'Woshday Official Store', nameStore: 'Shopee Woshday' },
  { id: 18, marketplace: 'Shopee', storeName: 'Gemistry Official Store', nameStore: 'Shopee Gemistry' },
  { id: 19, marketplace: 'Shopee', storeName: 'Sungboon Editor Official Store', nameStore: 'Shopee Sungboon Editor' },
  { id: 20, marketplace: 'Shopee', storeName: 'Derma Angel Official Store', nameStore: 'Shopee Derma Angel' },
  { id: 21, marketplace: 'Shopee', storeName: 'UIQ Official Store', nameStore: 'Shopee UIQ' },
  { id: 22, marketplace: 'Shopee', storeName: 'UB Mom Indonesia', nameStore: 'Shopee UB Mom' },
  { id: 23, marketplace: 'Shopee', storeName: 'Bioheal Official Store', nameStore: 'Shopee Bioheal' },
  { id: 24, marketplace: 'Lazada', storeName: 'COSRX Official Store', nameStore: 'Lazada Cosrx' },
  { id: 25, marketplace: 'Tiktok', storeName: 'Lilla Official store', nameStore: 'Tiktok_lilla' },
  { id: 26, marketplace: 'Tiktok', storeName: 'COSRX Official Store', nameStore: 'Tiktok_cosrx' },
  { id: 27, marketplace: 'Tiktok', storeName: 'Carasun.id Official Store', nameStore: 'Tiktok_carasun' },
  { id: 28, marketplace: 'Tiktok', storeName: 'Derma Angel Official Store', nameStore: 'Tiktok_derma_angel' },
  { id: 29, marketplace: 'Tiktok', storeName: 'Lilla Baby Indonesia', nameStore: 'Tiktok_lilla_Baby' },
  { id: 30, marketplace: 'Tiktok', storeName: 'Edit by Sociolla', nameStore: 'Tiktok' },
  { id: 31, marketplace: 'Tiktok', storeName: 'Round Lab Official Store', nameStore: 'Tiktok_roundlab' },
];
