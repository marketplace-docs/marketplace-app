
export type PerformanceData = {
    id: number;
    date: string;
    month: string;
    name: string;
    task_daily: number;
    total_items: number;
    job_desc: 'Picker' | 'Packer' | 'Putaway' | 'Interco' | 'Admin' | 'Picker Marketplace' | 'Admin Wave' | 'Packer Marketplace';
    shift: 'PAGI' | 'SORE';
    target: number;
    target_item: number;
    task_performance: number;
    items_performance: number;
    result: 'BERHASIL' | 'GAGAL';
};
