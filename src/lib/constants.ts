import { LayoutDashboard, ListTodo, Package, FileText, Settings, type LucideIcon } from 'lucide-react';

export type NavLink = {
    href: string;
    label: string;
    icon: LucideIcon;
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
        href: '/inventory',
        label: 'Admin Marketplace',
        icon: Package,
    },
    {
        href: '/reports',
        label: 'Reports',
        icon: FileText,
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: Settings,
    }
];
