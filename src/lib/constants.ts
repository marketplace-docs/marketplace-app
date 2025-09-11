
import { LayoutDashboard, ListTodo, Store, FileText, Settings, type LucideIcon, Briefcase, Users, Archive, BarChart3, AppWindow, BookText, Database, History, FilePlus, Eye, File, PieChart, Users2, Shield, Menu, Monitor } from 'lucide-react';

export type NavLink = {
    href: string;
    label: string;
    icon: LucideIcon;
    children?: NavLink[];
};

export const NAV_LINKS: NavLink[] = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        href: '#',
        label: 'Admin Task',
        icon: Briefcase,
        children: [
            {
                href: '/admin-task/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/admin-task/monitoring-manpower',
                label: 'Monitoring Manpower',
                icon: Eye,
            },
             {
                href: '/admin-task/task',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
    {
        href: '/putaway',
        label: 'Putaway',
        icon: Archive,
         children: [
            {
                href: '/putaway/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/putaway/monitoring-document',
                label: 'Monitoring Document',
                icon: Eye,
            },
             {
                href: '/putaway/task',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
    {
        href: '/marketplace',
        label: 'Marketplace',
        icon: Store,
        children: [
            {
                href: '/marketplace/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/marketplace-store',
                label: 'Monitoring Store',
                icon: Eye,
            },
             {
                href: '/tasks',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
    {
        href: '/reports',
        label: 'Reports',
        icon: FileText,
         children: [
            {
                href: '/backlog',
                label: 'Backlog',
                icon: Archive,
            },
            {
                href: '/reports/daily-performance',
                label: 'Daily Performance',
                icon: BarChart3,
            },
            {
                href: '/reports/kpi-performance',
                label: 'KPI Performance',
                icon: PieChart,
            },
        ]
    },
    {
        href: '/master',
        label: 'Master',
        icon: Database,
        children: [
            {
                href: '/database/user-management',
                label: 'User',
                icon: Users2,
            },
            {
                href: '/database/role',
                label: 'Role',
                icon: Shield,
            },
            {
                href: '/master/menu',
                label: 'Menu',
                icon: Menu,
            },
             {
                href: '/settings/app',
                label: 'APP',
                icon: Monitor,
            },
        ]
    }
];
