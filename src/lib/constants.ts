

import { LayoutDashboard, ListTodo, Store, FileText, Settings, type LucideIcon, Briefcase, Users, Archive, BarChart3, AppWindow, BookText, Database, History, FilePlus, Eye, File, PieChart, Users2, Shield, Menu, Monitor, Undo2, Route, Package, PackagePlus, PackageMinus, Boxes, CalendarClock, Warehouse, Calculator, PackageX } from 'lucide-react';

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
                href: '/putaway/go-putaway',
                label: 'Go-Putaway',
                icon: Route,
            },
            {
                href: '/putaway/update-expired',
                label: 'Update Expired',
                icon: CalendarClock,
            },
             {
                href: '/putaway/task',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
    {
        href: '#',
        label: 'Return',
        icon: Undo2,
         children: [
            {
                href: '/return/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/return/monitoring-document',
                label: 'Monitoring Document',
                icon: Eye,
            },
             {
                href: '/return/task',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
    {
        href: '#',
        label: 'Cycle Count',
        icon: Calculator,
         children: [
            {
                href: '/cycle-count/create',
                label: 'Create',
                icon: FilePlus,
            },
            {
                href: '/cycle-count/cc-location',
                label: 'CC Location',
                icon: Warehouse,
            },
            {
                href: '/cycle-count/monitoring',
                label: 'Monitoring Cycle Count',
                icon: Eye,
            },
             {
                href: '/cycle-count/task',
                label: 'Task',
                icon: ListTodo,
            },
        ]
    },
    {
        href: '/master-product',
        label: 'Master Product',
        icon: Package,
        children: [
             {
                href: '/master-product/batch-product',
                label: 'Batch Product',
                icon: Boxes,
            },
            {
                href: '/master-product/product-in',
                label: 'Stock In',
                icon: PackagePlus,
            },
            {
                href: '/master-product/product-out',
                label: 'Stock Out',
                icon: PackageMinus,
            },
            {
                href: '/master-product/out-of-stock',
                label: 'Out of Stock',
                icon: PackageX,
            },
            {
                href: '/master-product/stock-log',
                label: 'Stock Log',
                icon: History,
            },
             {
                href: '/master-product/location',
                label: 'Location',
                icon: Warehouse,
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
                href: '/marketplace/monitoring-store',
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
        href: '/database',
        label: 'Database',
        icon: Database,
        children: [
            {
                href: '/database/master-product',
                label: 'Master Product',
                icon: Package,
            },
            {
                href: '/database/user-management',
                label: 'User Management',
                icon: Users2,
            },
            {
                href: '/database/role',
                label: 'Role',
                icon: Shield,
            },
             {
                href: '/master/menu',
                label: 'Menu Permission',
                icon: Menu,
            },
             {
                href: '/database/log-activity',
                label: 'Log Activity',
                icon: History,
            },
        ]
    },
    {
        href: '/app-documentation',
        label: 'Dokumentasi Aplikasi',
        icon: BookText,
    },
    {
        href: '/settings/app',
        label: 'Settings',
        icon: Settings,
    }
];
