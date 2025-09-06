import { LayoutDashboard, ListTodo, Store, FileText, Settings, type LucideIcon, Briefcase, Users, Archive, BarChart3 } from 'lucide-react';

export type NavLink = {
    href: string;
    label: string;
    icon: LucideIcon;
    children?: NavLink[];
};

export const NAV_LINKS: NavLink[] = [
    {
        href: '/',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        href: '/tasks',
        label: 'Tasks',
        icon: ListTodo,
    },
    {
        href: '/marketplace-store',
        label: 'Marketplace',
        icon: Store,
        children: [
            {
                href: '/marketplace-store',
                label: 'Store Name',
                icon: Store,
            }
        ]
    },
    {
        href: '/admin-marketplace',
        label: 'Admin Marketplace',
        icon: Store,
        children: [
            {
                href: '/admin-marketplace/absensi-manpower',
                label: 'Absensi Manpower',
                icon: Briefcase,
            },
            {
                href: '/admin-marketplace/reports',
                label: 'Reports',
                icon: FileText,
            },
        ]
    },
    {
        href: '/backlog',
        label: 'Backlog',
        icon: Archive,
    },
    {
        href: '/reports',
        label: 'Database User',
        icon: Users,
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
    }
];
