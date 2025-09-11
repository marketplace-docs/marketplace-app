
export type AdminTask = {
  id: string;
  name: string;
  job: string;
  status: 'Hadir' | 'Absen';
  category: string;
  date: string;
};
