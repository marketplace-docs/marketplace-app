
export type PerformanceData = {
    id: number;
    date: string;
    month: string;
    name: string;
    taskDaily: number;
    totalItems: number;
    jobDesc: 'Picker Marketplace' | 'Admin Wave' | 'Packer Marketplace';
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

const initialData: Omit<PerformanceData, 'taskPerformance' | 'itemsPerformance' | 'result'>[] = [
    { id: 1, date: '2025-01-02', month: 'Januari - 25', name: 'Virgiawan Juhri', taskDaily: 2069, totalItems: 4935, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 2, date: '2025-01-02', month: 'Januari - 25', name: 'Diki Mauli', taskDaily: 1673, totalItems: 3580, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 3, date: '2025-01-02', month: 'Januari - 25', name: 'Edi Saputro', taskDaily: 822, totalItems: 1463, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 4, date: '2025-01-02', month: 'Januari - 25', name: 'Erwin Arifanto', taskDaily: 550, totalItems: 1463, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 5, date: '2025-01-02', month: 'Januari - 25', name: 'Luthfi Aditya', taskDaily: 413, totalItems: 1833, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 6, date: '2025-01-02', month: 'Januari - 25', name: 'Ishika Seherena Jingga Ramdani', taskDaily: 381, totalItems: 736, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 7, date: '2025-01-02', month: 'Januari - 25', name: 'Rais Setiawan', taskDaily: 275, totalItems: 491, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 8, date: '2025-01-02', month: 'Januari - 25', name: 'Nakula Anugrah Putra Ramdani', taskDaily: 243, totalItems: 419, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 9, date: '2025-01-02', month: 'Januari - 25', name: 'Sadewa Anugrah Putra Ramdani', taskDaily: 215, totalItems: 315, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 10, date: '2025-01-02', month: 'Januari - 25', name: 'Lailatul Marisa', taskDaily: 217, totalItems: 329, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945 },
    { id: 11, date: '2025-01-02', month: 'Januari - 25', name: 'Yoga Pratama', taskDaily: 1781, totalItems: 2156, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945 },
    { id: 12, date: '2025-01-02', month: 'Januari - 25', name: 'Riky Fajar', taskDaily: 1026, totalItems: 1283, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945 },
    { id: 13, date: '2025-01-02', month: 'Januari - 25', name: 'Pirman Perdiansah', taskDaily: 391, totalItems: 776, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945 },
    { id: 14, date: '2025-01-02', month: 'Januari - 25', name: 'Ismil Shidia Fathanah', taskDaily: 346, totalItems: 662, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945 },
    { id: 15, date: '2025-01-02', month: 'Januari - 25', name: 'Ekrom Saputra', taskDaily: 334, totalItems: 575, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945 },
    { id: 16, date: '2025-01-02', month: 'Januari - 25', name: 'Nurul Tanzila', taskDaily: 7659, totalItems: 11345, jobDesc: 'Admin Wave', shift: 'PAGI', target: 1655, targetItem: 5230 },
    { id: 17, date: '2025-01-02', month: 'Januari - 25', name: 'Nova Aurelia Herman', taskDaily: 3847, totalItems: 9697, jobDesc: 'Admin Wave', shift: 'SORE', target: 1655, targetItem: 5230 },
    { id: 18, date: '2025-01-02', month: 'Januari - 25', name: 'Zanuar Hendriawan', taskDaily: 147, totalItems: 221, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050 },
    { id: 19, date: '2025-01-02', month: 'Januari - 25', name: 'Azzahra', taskDaily: 161, totalItems: 939, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050 },
    { id: 20, date: '2025-01-02', month: 'Januari - 25', name: 'Nurul Mutasaiyah', taskDaily: 180, totalItems: 352, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050 },
    { id: 21, date: '2025-01-02', month: 'Januari - 25', name: 'Musrifah', taskDaily: 192, totalItems: 472, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050 },
    { id: 22, date: '2025-01-02', month: 'Januari - 25', name: 'Salsa Dillah', taskDaily: 220, totalItems: 611, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050 },
    { id: 23, date: '2025-01-02', month: 'Januari - 25', name: 'Aisyah Ajeng', taskDaily: 297, totalItems: 782, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050 },
    { id: 24, date: '2025-01-02', month: 'Januari - 25', name: 'Rize Anggraini', taskDaily: 542, totalItems: 596, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050 },
    { id: 25, date: '2025-01-02', month: 'Januari - 25', name: 'Gita Pramesti', taskDaily: 877, totalItems: 943, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050 },
    { id: 26, date: '2025-01-02', month: 'Januari - 25', name: 'Erni Atriyanti', taskDaily: 904, totalItems: 1069, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050 },
    { id: 27, date: '2025-01-02', month: 'Januari - 25', name: 'Tria Maharani', taskDaily: 279, totalItems: 559, jobDesc: 'Packer Marketplace', shift: 'PAGI', target: 360, targetItem: 1050 },
    { id: 28, date: '2025-01-02', month: 'Januari - 25', name: 'Citra Ayungtiyas', taskDaily: 360, totalItems: 599, jobDesc: 'Packer Marketplace', shift: 'PAGI', target: 360, targetItem: 1050 },
    { id: 29, date: '2025-01-02', month: 'Januari - 25', name: 'Ferlina Lova', taskDaily: 397, totalItems: 1183, jobDesc: 'Packer Marketplace', shift: 'PAGI', target: 360, targetItem: 1050 },
    { id: 30, date: '2025-01-02', month: 'Januari - 25', name: 'Andika Pratama', taskDaily: 442, totalItems: 1173, jobDesc: 'Packer Marketplace', shift: 'PAGI', target: 360, targetItem: 1050 },
];

export const performanceData: PerformanceData[] = calculatePerformance(initialData);
