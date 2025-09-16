export type CycleCountDoc = {
    id: number;
    created_at: string;
    no_document: string;
    date: string;
    counter_name: string;
    count_type: 'By Location' | 'By SKU';
    items_to_count: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
    notes?: string;
};
