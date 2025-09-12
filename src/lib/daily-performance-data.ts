
export type PerformanceData = {
    id: number;
    date: string;
    month: string;
    name: string;
    taskDaily: number;
    totalItems: number;
    jobDesc: 'Picker' | 'Packer' | 'Putaway' | 'Interco' | 'Admin' | 'Picker Marketplace' | 'Admin Wave' | 'Packer Marketplace';
    shift: 'PAGI' | 'SORE';
    target: number;
    targetItem: number;
    taskPerformance: number;
    itemsPerformance: number;
    result: 'BERHASIL' | 'GAGAL';
};

const calculatePerformance = (data: Omit<PerformanceData, 'taskPerformance' | 'itemsPerformance' | 'result'>[]): PerformanceData[] => {
    return data.map(item => {
        const taskPerformance = item.target > 0 ? Math.round((item.taskDaily / item.target) * 100) : 0;
        const itemsPerformance = item.targetItem > 0 ? Math.round((item.totalItems / item.targetItem) * 100) : 0;
        const result: 'BERHASIL' | 'GAGAL' = taskPerformance >= 100 ? 'BERHASIL' : 'GAGAL';
        
        return {
            ...item,
            taskPerformance,
            itemsPerformance,
            result,
        };
    });
};

const initialData: Omit<PerformanceData, 'taskPerformance' | 'itemsPerformance' | 'result'>[] = [];

export const performanceData: PerformanceData[] = calculatePerformance(initialData);
