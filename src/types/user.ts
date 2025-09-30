
export type User = {
    id: number;
    name: string;
    email: string;
    status: 'Staff' | 'Reguler' | 'Event';
    role: string;
};
