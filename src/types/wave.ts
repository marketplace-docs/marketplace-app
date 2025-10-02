
export type Wave = {
    id: number;
    created_at: string;
    wave_document_number: string;
    wave_type: string;
    status: 'Wave Progress' | 'Wave Done';
    total_orders: number;
    created_by: string;
    picked_orders_count?: number; 
};
