
export type PutawayDocument = {
  id: string;
  noDocument: string;
  date: string; // ISO string
  qty: number;
  status: 'Done' | 'Pending';
};
