
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

export const performanceData: PerformanceData[] = [
    { id: 1, date: '2025-01-02', month: 'Januari - 25', name: 'Virgiawan Juhri', taskDaily: 2069, totalItems: 4935, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 455, itemsPerformance: 522, result: 'BERHASIL' },
    { id: 2, date: '2025-01-02', month: 'Januari - 25', name: 'Diki Mauli', taskDaily: 1673, totalItems: 3580, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 368, itemsPerformance: 379, result: 'BERHASIL' },
    { id: 3, date: '2025-01-02', month: 'Januari - 25', name: 'Edi Saputro', taskDaily: 822, totalItems: 1463, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 181, itemsPerformance: 155, result: 'BERHASIL' },
    { id: 4, date: '2025-01-02', month: 'Januari - 25', name: 'Erwin Arifanto', taskDaily: 550, totalItems: 1463, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 121, itemsPerformance: 155, result: 'BERHASIL' },
    { id: 5, date: '2025-01-02', month: 'Januari - 25', name: 'Luthfi Aditya', taskDaily: 413, totalItems: 1833, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 91, itemsPerformance: 194, result: 'GAGAL' },
    { id: 6, date: '2025-01-02', month: 'Januari - 25', name: 'Ishika Seherena Jingga Ramdani', taskDaily: 381, totalItems: 736, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 84, itemsPerformance: 78, result: 'GAGAL' },
    { id: 7, date: '2025-01-02', month: 'Januari - 25', name: 'Rais Setiawan', taskDaily: 275, totalItems: 491, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 60, itemsPerformance: 52, result: 'GAGAL' },
    { id: 8, date: '2025-01-02', month: 'Januari - 25', name: 'Nakula Anugrah Putra Ramdani', taskDaily: 243, totalItems: 419, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 53, itemsPerformance: 44, result: 'GAGAL' },
    { id: 9, date: '2025-01-02', month: 'Januari - 25', name: 'Sadewa Anugrah Putra Ramdani', taskDaily: 215, totalItems: 315, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 47, itemsPerformance: 33, result: 'GAGAL' },
    { id: 10, date: '2025-01-02', month: 'Januari - 25', name: 'Lailatul Marisa', taskDaily: 217, totalItems: 329, jobDesc: 'Picker Marketplace', shift: 'PAGI', target: 455, targetItem: 945, taskPerformance: 48, itemsPerformance: 35, result: 'GAGAL' },
    { id: 11, date: '2025-01-02', month: 'Januari - 25', name: 'Yoga Pratama', taskDaily: 1781, totalItems: 2156, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945, taskPerformance: 391, itemsPerformance: 228, result: 'BERHASIL' },
    { id: 12, date: '2025-01-02', month: 'Januari - 25', name: 'Riky Fajar', taskDaily: 1026, totalItems: 1283, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945, taskPerformance: 225, itemsPerformance: 136, result: 'BERHASIL' },
    { id: 13, date: '2025-01-02', month: 'Januari - 25', name: 'Pirman Perdiansah', taskDaily: 391, totalItems: 776, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945, taskPerformance: 86, itemsPerformance: 82, result: 'GAGAL' },
    { id: 14, date: '2025-01-02', month: 'Januari - 25', name: 'Ismil Shidia Fathanah', taskDaily: 346, totalItems: 662, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945, taskPerformance: 76, itemsPerformance: 70, result: 'GAGAL' },
    { id: 15, date: '2025-01-02', month: 'Januari - 25', name: 'Ekrom Saputra', taskDaily: 334, totalItems: 575, jobDesc: 'Picker Marketplace', shift: 'SORE', target: 455, targetItem: 945, taskPerformance: 73, itemsPerformance: 61, result: 'GAGAL' },
    { id: 16, date: '2025-01-02', month: 'Januari - 25', name: 'Nurul Tanzila', taskDaily: 7659, totalItems: 11345, jobDesc: 'Admin Wave', shift: 'PAGI', target: 1655, targetItem: 5230, taskPerformance: 463, itemsPerformance: 217, result: 'BERHASIL' },
    { id: 17, date: '2025-01-02', month: 'Januari - 25', name: 'Nova Aurelia Herman', taskDaily: 3847, totalItems: 9697, jobDesc: 'Admin Wave', shift: 'SORE', target: 1655, targetItem: 5230, taskPerformance: 232, itemsPerformance: 185, result: 'BERHASIL' },
    { id: 18, date: '2025-01-02', month: 'Januari - 25', name: 'Zanuar Hendriawan', taskDaily: 147, totalItems: 221, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050, taskPerformance: 41, itemsPerformance: 21, result: 'GAGAL' },
    { id: 19, date: '2025-01-02', month: 'Januari - 25', name: 'Azzahra', taskDaily: 161, totalItems: 939, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050, taskPerformance: 45, itemsPerformance: 89, result: 'GAGAL' },
    { id: 20, date: '2025-01-02', month: 'Januari - 25', name: 'Nurul Mutasaiyah', taskDaily: 180, totalItems: 352, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050, taskPerformance: 50, itemsPerformance: 34, result: 'GAGAL' },
    { id: 21, date: '2025-01-02', month: 'Januari - 25', name: 'Musrifah', taskDaily: 192, totalItems: 472, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050, taskPerformance: 53, itemsPerformance: 45, result: 'GAGAL' },
    { id: 22, date: '2025-01-02', month: 'Januari - 25', name: 'Salsa Dillah', taskDaily: 220, totalItems: 611, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050, taskPerformance: 61, itemsPerformance: 58, result: 'GAGAL' },
    { id: 23, date: '2025-01-02', month: 'Januari - 25', name: 'Aisyah Ajeng', taskDaily: 297, totalItems: 782, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050, taskPerformance: 83, itemsPerformance: 74, result: 'GAGAL' },
    { id: 24, date: '2025-01-02', month: 'Januari - 25', name: 'Rize Anggraini', taskDaily: 542, totalItems: 596, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050, taskPerformance: 151, itemsPerformance: 57, result: 'BERHASIL' },
    { id: 25, date: '2025-01-02', month: 'Januari - 25', name: 'Gita Pramesti', taskDaily: 877, totalItems: 943, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050, taskPerformance: 244, itemsPerformance: 90, result: 'BERHASIL' },
    { id: 26, date: '2025-01-02', month: 'Januari - 25', name: 'Erni Atriyanti', taskDaily: 904, totalItems: 1069, jobDesc: 'Packer Marketplace', shift: 'SORE', target: 360, targetItem: 1050, taskPerformance: 251, itemsPerformance: 102, result: 'BERHASIL' },
    { id: 27, date: '2025-01-02', month: 'Januari - 25', name: 'Tria Maharani', taskDaily: 279, totalItems: 559, jobDesc: 'Packer Marketplace', shift: 'PAGI', target: 360, targetItem: 1050, taskPerformance: 78, itemsPerformance: 53, result: 'GAGAL' },
    { id: 28, date: '2025-01-02', month: 'Januari - 25', name: 'Citra Ayungtiyas', taskDaily: 360, totalItems: 599, jobDesc: 'Packer Marketplace', shift: 'PAGI', target: 360, targetItem: 1050, taskPerformance: 100, itemsPerformance: 57, result: 'GAGAL' },
    { id: 29, date: '2025-01-02', month: 'Januari - 25', name: 'Ferlina Lova', taskDaily: 397, totalItems: 1183, jobDesc: 'Packer Marketplace', shift: 'PAGI', target: 360, targetItem: 1050, taskPerformance: 110, itemsPerformance: 113, result: 'BERHASIL' },
    { id: 30, date: '2025-01-02', month: 'Januari - 25', name: 'Andika Pratama', taskDaily: 442, totalItems: 1173, jobDesc: 'Packer Marketplace', shift: 'PAGI', target: 360, targetItem: 1050, taskPerformance: 123, itemsPerformance: 112, result: 'BERHASIL' },
];
