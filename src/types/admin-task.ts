
export type AdminTask = {
  id: string;
  name: string;
  job: string;
  status: 'Hadir' | 'Absen';
  category: 'Reguler' | 'Event' | 'Staff' | string;
  date: string;
};
