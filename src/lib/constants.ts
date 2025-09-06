import { LayoutDashboard, ListTodo, Store, FileText, Settings, type LucideIcon, Briefcase, Users, Archive, BarChart3, AppWindow, BookText, Database } from 'lucide-react';

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
        href: '/database',
        label: 'Database',
        icon: Database,
        children: [
            {
                href: '/database/user',
                label: 'User',
                icon: Users,
            },
            {
                href: '/database/role',
                label: 'Role',
                icon: Briefcase,
            }
        ]
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
        children: [
            {
                href: '/settings',
                label: 'APP',
                icon: AppWindow,
            },
            {
                href: '/settings/documentation',
                label: 'Documentation',
                icon: BookText,
            }
        ]
    }
];
