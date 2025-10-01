
export type User = {
    id: number;
    name: string; // This will be treated as username
    full_name: string;
    email: string;
    status: 'Staff' | 'Reguler' | 'Event';
    role: string;
};
